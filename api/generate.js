import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";

// --- Schema Definition (für Structured Output) ---
const recipeSchema = {
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
                                    category: { type: SchemaType.STRING },
                                },
                                required: ["item", "amount", "unit"],
                            },
                        },
                        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        tips: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER },
                    },
                    required: ["title", "prepTime", "ingredients", "steps"],
                },
                profi: {
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
                                    category: { type: SchemaType.STRING },
                                },
                                required: ["item", "amount", "unit"],
                            },
                        },
                        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        tips: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER },
                    },
                    required: ["title", "ingredients", "steps"],
                },
                airfryer: {
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
                                    category: { type: SchemaType.STRING },
                                },
                                required: ["item", "amount", "unit"],
                            },
                        },
                        steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        tips: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER },
                    },
                    required: ["title", "ingredients", "steps"],
                },
            },
            required: ["student", "profi", "airfryer"],
        },
    },
    required: ["originalName", "versions"],
};

function buildUserPrompt(prompt, sourceType) {
    if (sourceType === "pantry") {
        return `Zutatenliste: ${prompt}. Baue daraus ein Gericht mit drei Varianten (Student günstig, Profi, Airfryer).`;
    }
    if (sourceType === "scan") {
        return "Analysiere das Bild, identifiziere das Gericht und liefere drei Varianten (Student, Profi, Airfryer).";
    }
    return `Gericht: "${prompt}". Gib drei Varianten (Student, Profi, Airfryer).`;
}

function normalizeRecipeResponse(data) {
    const originalName = data.originalName || "Unbenanntes Gericht";

    const normalizeIngredients = (ings) => {
        if (!Array.isArray(ings)) return [];
        return ings.map((ing) => ({
            item: ing.item || "Zutat",
            amount: ing.amount || 0,
            unit: ing.unit || "Stk",
            category: ing.category || "Sonstiges",
        }));
    };

    const normalizeVersion = (v) => ({
        title: v?.title || "Version",
        prepTime: v?.prepTime || "30 min",
        ingredients: normalizeIngredients(v?.ingredients),
        steps: Array.isArray(v?.steps) ? v.steps : ["Zubereitungsschritte fehlen."],
        tips: v?.tips || "",
        calories: v?.calories || 0,
    });

    return {
        originalName,
        versions: {
            student: normalizeVersion(data.versions?.student),
            profi: normalizeVersion(data.versions?.profi),
            airfryer: normalizeVersion(data.versions?.airfryer),
        },
    };
}

export default async function handler(req, res) {
    // Allow CORS for local Vite dev (localhost:5173)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY not set in environment");
            res.status(500).json({ error: "API key not configured. Check Vercel Environment Variables." });
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction:
                "Du bist ChefMate, ein pragmatischer Küchenassistent. Gib IMMER exakt JSON im folgenden Schema zurück (keine Prosa, keine Erklärungen). Sprache: Deutsch, metrische Einheiten. Nutze zutreffende Kategorien für Zutaten. Liefere drei Varianten: Student (günstig), Profi (gourmet), Airfryer (gerät).",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });

        const { prompt, sourceType, imageBase64 } = req.body || {};
        if (!prompt) {
            res.status(400).json({ error: "Missing 'prompt' in request body" });
            return;
        }
        if (!sourceType) {
            res.status(400).json({ error: "Missing 'sourceType' in request body (expect 'pantry', 'scan', or 'text')" });
            return;
        }

        const userPrompt = buildUserPrompt(prompt, sourceType);

        const parts = [{ text: userPrompt }];
        if (imageBase64) {
            parts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64,
                },
            });
        }

        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
        });

        const response = await result.response;
        const text = response.text();

        const parsed = JSON.parse(text);
        const normalized = normalizeRecipeResponse(parsed);

        const recipe = {
            recipeId: uuidv4(),
            ...normalized,
            sourceType,
            createdAt: Date.now(),
        };

        res.status(200).json({ recipe });
        return;
    } catch (error) {
        console.error("/api/generate error:", error);
        res.status(500).json({ error: String(error?.message || error) });
    }
}
