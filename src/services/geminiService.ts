import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, RecipeVersions } from "../types";
import { v4 as uuidv4 } from 'uuid';

const currentKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY as string | undefined;
if (currentKey) console.log("Aktueller Key:", currentKey);

// Vite exposes only env vars prefixed with VITE_ to client-side code.
// Keep initialization lazy so the app doesn't crash on startup if the key is missing.
const getGeminiClient = () => {
  const apiKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    throw new Error(
      "Missing API key. Set VITE_GEMINI_API_KEY in .env.local and restart the dev server."
    );
  }

  return new GoogleGenAI({ apiKey });
};

const ingredientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    unit: { type: Type.STRING },
    category: { type: Type.STRING, description: "Kategorie wie Gemüse, Milchprodukte, Fleisch, Vorrat, Gewürze" },
  },
  // category ist im TS-Type optional; wir normalisieren es nach dem Parse.
  required: ["item", "amount", "unit"],
};

const versionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    prepTime: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: ingredientSchema },
    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    tips: { type: Type.STRING },
    calories: { type: Type.NUMBER },
  },
  required: ["title", "prepTime", "ingredients", "steps", "tips"],
};

const recipeResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalName: { type: Type.STRING },
    versions: {
      type: Type.OBJECT,
      properties: {
        student: versionSchema,
        profi: versionSchema,
        airfryer: versionSchema,
      },
      required: ["student", "profi", "airfryer"],
    },
  },
  required: ["originalName", "versions"],
};

export const generateRecipe = async (
  prompt: string,
  sourceType: Recipe['sourceType'],
  imageBase64?: string
): Promise<Recipe> => {
  // Preview-Modelle sind je nach Key/Region nicht immer freigeschaltet.
  // Für Local Testing nehmen wir bewusst ein stabiles Modell.
  const modelId = "gemini-1.5-flash";

  let finalPrompt = "";

  if (sourceType === 'pantry') {
    finalPrompt = `Erstelle ein stimmiges Gericht aus diesen Zutaten: ${prompt}. Erstelle 3 Versionen: Student (einfach/günstig), Profi (authentisch/Gourmet) und Airfryer (falls anwendbar oder für Küchengeräte optimiert). Gib das Ergebnis auf Deutsch zurück.`;
  } else if (sourceType === 'scan') {
    finalPrompt = "Analysiere dieses Menü oder Essensbild. Identifiziere das Gericht und erstelle 3 Versionen: Student, Profi und Airfryer. Gib das Ergebnis auf Deutsch zurück.";
  } else {
    finalPrompt = `Erstelle 3 Versionen des Gerichts "${prompt}": Student (einfach/günstig), Profi (authentisch/Gourmet) und Airfryer (geräteoptimiert). Gib das Ergebnis auf Deutsch zurück.`;
  }

  const parts: any[] = [{ text: finalPrompt }];
  if (imageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeResponseSchema,
        systemInstruction: "Du bist eine erstklassige Chef-KI. Du adaptierst Rezepte in 3 spezifische Stile: Student (schnell, billig, einfach), Profi (authentisch, hohe Technik, Premium-Zutaten) und Airfryer (optimiert für Heißluft/Geräte). Kategorisiere Zutaten immer konsistent auf Deutsch (z.B. 'Gemüse', 'Fleisch', 'Milchprodukte', 'Vorrat'). Fülle das Feld 'category' immer aus. Wenn unsicher, nutze 'Sonstiges'.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsedData = JSON.parse(text);

    const normalized: { originalName: string; versions: RecipeVersions } = normalizeRecipeResponse(parsedData);

    return {
      recipeId: uuidv4(),
      originalName: normalized.originalName,
      versions: normalized.versions,
      sourceType,
      createdAt: Date.now(),
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const normalizeRecipeResponse = (data: any): { originalName: string; versions: RecipeVersions } => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid AI response: not an object');
  }

  const originalName = typeof data.originalName === 'string' && data.originalName.trim()
    ? data.originalName.trim()
    : 'Unbenanntes Gericht';

  const versions = data.versions;
  if (!versions || typeof versions !== 'object') {
    throw new Error('Invalid AI response: missing versions');
  }

  const requiredKeys: Array<keyof RecipeVersions> = ['student', 'profi', 'airfryer'];
  for (const k of requiredKeys) {
    if (!versions[k] || typeof versions[k] !== 'object') {
      throw new Error(`Invalid AI response: missing version '${k}'`);
    }
  }

  const normalizeIngredients = (ings: any[]): any[] => {
    if (!Array.isArray(ings)) return [];
    return ings.map((ing) => ({
      ...ing,
      category: typeof ing?.category === 'string' && ing.category.trim() ? ing.category.trim() : 'Sonstiges',
    }));
  };

  const normalizeVersion = (v: any) => ({
    ...v,
    ingredients: normalizeIngredients(v?.ingredients),
    steps: Array.isArray(v?.steps) ? v.steps : [],
  });

  return {
    originalName,
    versions: {
      student: normalizeVersion(versions.student),
      profi: normalizeVersion(versions.profi),
      airfryer: normalizeVersion(versions.airfryer),
    } as RecipeVersions,
  };
};