/// <reference types="vite/client" />

import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Recipe, RecipeVersions } from "../types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialisiert den Gemini-Client nur bei Bedarf (Lazy Loading).
 * Verhindert Abstürze beim App-Start, falls der Key fehlt.
 */
const getGeminiClient = () => {
  // Zugriff auf Umgebungsvariablen gemäß Vite-Standard
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key fehlt! Bitte VITE_GEMINI_API_KEY in .env.local oder Vercel Settings prüfen.");
    throw new Error(
      "Missing API key. Set VITE_GEMINI_API_KEY in .env.local and restart the dev server."
    );
  }

  return new GoogleGenAI({ apiKey });
};

// --- Schemas für Structured Output ---

const ingredientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    unit: { type: Type.STRING },
    category: { type: Type.STRING, description: "Kategorie wie Gemüse, Milchprodukte, Fleisch, Vorrat, Gewürze" },
  },
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

// --- Hauptfunktion ---

export const generateRecipe = async (
  prompt: string,
  sourceType: Recipe['sourceType'],
  imageBase64?: string
): Promise<Recipe> => {
  const modelId = "gemini-1.5-flash-001"; // Stabiles Modell für Production
  let finalPrompt = "";

  // Prompt-Logik basierend auf Source-Type
  if (sourceType === 'pantry') {
    finalPrompt = `Erstelle ein stimmiges Gericht aus diesen Zutaten: ${prompt}. Erstelle 3 Versionen: Student (einfach/günstig), Profi (authentisch/Gourmet) und Airfryer (falls anwendbar oder für Küchengeräte optimiert). Gib das Ergebnis auf Deutsch zurück.`;
  } else if (sourceType === 'scan') {
    finalPrompt = "Analysiere dieses Menü oder Essensbild. Identifiziere das Gericht und erstelle 3 Versionen: Student, Profi und Airfryer. Gib das Ergebnis auf Deutsch zurück.";
  } else {
    finalPrompt = `Erstelle 3 Versionen des Gerichts "${prompt}": Student (einfach/günstig), Profi (authentisch/Gourmet) und Airfryer (geräteoptimiert). Gib das Ergebnis auf Deutsch zurück.`;
  }

  const parts: any[] = [{ text: finalPrompt }];

  // Bild anhängen, falls vorhanden
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
        systemInstruction: "Du bist eine erstklassige Chef-KI. Du adaptierst Rezepte in 3 spezifische Stile: Student (schnell, billig, einfach), Profi (authentisch, hohe Technik, Premium-Zutaten) und Airfryer (optimiert für Heißluft/Geräte). Kategorisiere Zutaten immer konsistent auf Deutsch. Fülle das Feld 'category' immer aus.",
      },
    });

    // SDK-Varianten: response.text kann entweder ein String (Getter) oder eine Funktion sein
    const text =
      typeof (response as any).text === "function"
        ? (response as any).text()
        : (response as any).text;

    if (!text) throw new Error("No response from AI");

    const parsedData = JSON.parse(text);
    const normalized = normalizeRecipeResponse(parsedData);

    return {
      id: uuidv4(), // Angepasst an 'id' laut Domain-Model (03_domain-models.md)
      title: normalized.originalName, // Mapping auf 'title' laut Domain-Model
      description: "Generiertes Rezept", // Fallback, da Schema dies nicht liefert
      ingredients: normalized.versions.student.ingredients, // Default-Anzeige
      steps: normalized.versions.student.steps, // Default-Anzeige
      // Sie speichern hier versionsspezifische Daten vermutlich in einem erweiterten State, 
      // aber ich halte mich an das Return-Type Interface.
      ...normalized, // Falls Ihr Recipe-Type erweitert wurde
      sourceType,
      createdAt: Date.now(),
    } as any; // Cast as any, da Ihr lokaler Type evtl. von 03_domain-models.md abweicht (RecipeVersions)

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- Helper: Normalisierung ---

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