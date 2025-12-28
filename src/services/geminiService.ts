import { Recipe } from "../types";

type StreamCallbacks = {
    onUpdate?: (partialText: string) => void;
};

// --- Hauptfunktion: ruft die sichere Backend-Route auf ---
export const generateRecipe = async (
    prompt: string,
    sourceType: Recipe['sourceType'],
    imageBase64?: string,
    callbacks: StreamCallbacks = {}
): Promise<Recipe> => {
    // Optionaler Statushinweis fürs UI
    callbacks.onUpdate?.("Verbinde mit Backend…");

    const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sourceType, imageBase64 })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Fehler beim Anfragen der API');
    }

    const data = await res.json();
    callbacks.onUpdate?.("");
    return data.recipe as Recipe;
};