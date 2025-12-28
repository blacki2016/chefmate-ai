/// <reference types="vite/client" />

import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { Recipe, RecipeVersions } from "../types";
import { v4 as uuidv4 } from 'uuid';

// --- Konfiguration ---
const MODEL_CHAIN = ["gemini-1.5-flash", "gemini-1.5-pro"];
const BASE_SYSTEM_INSTRUCTION = `
Du bist ChefMate, ein pragmatischer Küchenassistent.
Gib IMMER exakt JSON im folgenden Schema zurück (keine Prosa, keine Erklärungen).
Sprache: Deutsch, metrische Einheiten. Nutze zutreffende Kategorien für Zutaten.
Liefere drei Varianten: Student (günstig), Profi (gourmet), Airfryer (gerät).
`;

// --- Schema Definition (für Structured Output) ---
// Definiert exakt, wie das JSON aussehen muss.
const recipeSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        originalName: { type: SchemaType.STRING },
        versions: {
            type: SchemaType.OBJECT,
            properties: {
                student: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING },
                        prepTime: { type: SchemaType.STRING },
                        ingredients: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    item: { type: SchemaType.STRING },
                                    amount: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING },
                                    category: { type: SchemaType.STRING }
                                },
                                required: ["item", "amount", "unit"]
                            }
                        },
                        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        tips: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER }
                    },
                    required: ["title", "prepTime", "ingredients", "steps"]
                },
                profi: { // Identische Struktur wie Student, hier abgekürzt der Logik halber
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING },
                        prepTime: { type: SchemaType.STRING },
                        ingredients: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    item: { type: SchemaType.STRING },
                                    amount: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING },
                                    category: { type: SchemaType.STRING }
                                },
                                required: ["item", "amount", "unit"]
                            }
                        },
                        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        tips: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER }
                    },
                    required: ["title", "ingredients", "steps"]
                },
                airfryer: { // Identische Struktur
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING },
                        prepTime: { type: SchemaType.STRING },
                        ingredients: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    item: { type: SchemaType.STRING },
                                    amount: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING },
                                    category: { type: SchemaType.STRING }
                                },
                                required: ["item", "amount", "unit"]
                            }
                        },
                        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        tips: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER }
                    },
                    required: ["title", "ingredients", "steps"]
                }
            },
            required: ["student", "profi", "airfryer"]
        }
    },
    required: ["originalName", "versions"]
};

type StreamCallbacks = {
    onUpdate?: (partialText: string) => void;
};

// Lazy Initialization des Clients, damit App nicht crasht ohne Key beim Start
const getGeminiModel = (modelName: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("API Key fehlt! Bitte VITE_GEMINI_API_KEY in .env.local prüfen.");
        throw new Error("Missing API key. Set VITE_GEMINI_API_KEY in .env.local.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Wir konfigurieren das Modell direkt mit JSON-Schema für perfekte Struktur
    return genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        }
    });
};

const buildUserPrompt = (prompt: string, sourceType: Recipe['sourceType']) => {
    if (sourceType === 'pantry') {
        return `Zutatenliste: ${prompt}. Baue daraus ein Gericht mit drei Varianten (Student günstig, Profi, Airfryer).`;
    }
    if (sourceType === 'scan') {
        return "Analysiere das Bild, identifiziere das Gericht und liefere drei Varianten (Student, Profi, Airfryer).";
    }
    return `Gericht: "${prompt}". Gib drei Varianten (Student, Profi, Airfryer).`;
};

// --- Hauptfunktion ---
export const generateRecipe = async (
    prompt: string,
    sourceType: Recipe['sourceType'],
    imageBase64?: string,
    callbacks: StreamCallbacks = {}
): Promise<Recipe> => {

    const userPrompt = buildUserPrompt(prompt, sourceType);

    // Input Parts zusammenbauen
    const parts: any[] = [{ text: userPrompt }];
    if (imageBase64) {
        // Das Format für Bilder ist in der neuen Library leicht anders:
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
            }
        });
    }

    let lastError: unknown;

    for (const modelName of MODEL_CHAIN) {
        try {
            const model = getGeminiModel(modelName);
            const streamResult = await model.generateContentStream({
                contents: [{ role: "user", parts }],
            });

            let buffer = "";
            for await (const response of streamResult.stream) {
                const chunk = response.text();
                if (!chunk) continue;
                buffer += chunk;
                callbacks.onUpdate?.(buffer);
            }

            const fullResponse = await streamResult.response;
            const text = fullResponse.text();

            // Parsen und Normalisieren
            const parsedData = JSON.parse(text);
            const normalized = normalizeRecipeResponse(parsedData);

            return {
                recipeId: uuidv4(),
                ...normalized,
                sourceType,
                createdAt: Date.now(),
            };

        } catch (error: any) {
            lastError = error;

            if (shouldRetry(error)) {
                console.warn(`Model ${modelName} failed, trying fallback...`, error);
                continue;
            }

            console.error("Gemini Service Error:", error);
            throw error;
        }
    }

    throw lastError || new Error("Gemini konnte kein Rezept liefern.");
};

// --- Helper: Daten Normalisierung ---
const normalizeRecipeResponse = (data: any): { originalName: string; versions: RecipeVersions } => {
    // Fallback Logik, falls Felder leer sind
    const originalName = data.originalName || 'Unbenanntes Gericht';

    const normalizeIngredients = (ings: any[]): any[] => {
        if (!Array.isArray(ings)) return [];
        return ings.map(ing => ({
            item: ing.item || "Zutat",
            amount: ing.amount || 0,
            unit: ing.unit || "Stk",
            category: ing.category || "Sonstiges"
        }));
    };

    const normalizeVersion = (v: any) => ({
        title: v?.title || "Version",
        prepTime: v?.prepTime || "30 min",
        ingredients: normalizeIngredients(v?.ingredients),
        steps: Array.isArray(v?.steps) ? v.steps : ["Zubereitungsschritte fehlen."],
        tips: v?.tips || "",
        calories: v?.calories || 0
    });

    return {
        originalName,
        versions: {
            student: normalizeVersion(data.versions?.student),
            profi: normalizeVersion(data.versions?.profi),
            airfryer: normalizeVersion(data.versions?.airfryer),
        } as RecipeVersions
    };
};

const shouldRetry = (error: any) => {
    const status = error?.status || error?.response?.status;
    const message = String(error?.message || "").toLowerCase();
    return status === 503 || status === 500 || message.includes("503") || message.includes("unavailable");
};