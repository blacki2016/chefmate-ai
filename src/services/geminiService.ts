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
        // Try to parse error response as JSON
        let errorMessage = `API Error ${res.status}`;
        try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
        } catch {
            // Fallback: plain text or generic message
            const text = await res.text();
            if (text) {
                errorMessage = text.substring(0, 200); // Limit length
            }
        }
        throw new Error(errorMessage);
    }

    const data = await res.json();

    // Validate response structure
    if (!data.recipe) {
        throw new Error("Invalid API response: missing 'recipe' field");
    }

    callbacks.onUpdate?.("");
    return data.recipe as Recipe;
};