# Gemini / AI Integration

## Ort
- Client-Service: `src/services/geminiService.ts`

## SDK
- `@google/genai` (`GoogleGenAI`)

## API Key Handling
- Der Client liest **clientseitig**: `import.meta.env.VITE_GEMINI_API_KEY`.
- Ohne Key wird beim ersten API-Call ein Fehler geworfen (lazy init), damit die App beim Start nicht sofort crasht.

Empfohlenes Local Setup:
- `.env.local` mit `VITE_GEMINI_API_KEY=...`
- Dev-Server neu starten

## Modell
- `modelId = "gemini-3-flash-preview"`

## Prompting-Strategie
Je nach `sourceType` wird ein deutscher Prompt gebaut:
- `search`: 3 Versionen für ein Gericht
- `pantry`: Gericht aus Zutatenliste
- `scan`: Bild/Menü analysieren
- `social`: textueller „Rezept von URL“-Prompt (kein echtes Scraping)

## Multimodal Input
- Wenn `imageBase64` existiert, wird ein `inlineData`-Part vor den Text gepackt:
  - `mimeType: image/jpeg`
  - `data: <base64>`

## Strukturierte Ausgabe
- `responseMimeType: "application/json"`
- `responseSchema: recipeResponseSchema`

### Schema (Konzept)
- Root:
  - `originalName: string`
  - `versions: { student, profi, airfryer }`
- Jede Version:
  - `title`, `prepTime`, `ingredients[]`, `steps[]`, `tips`, optional `calories`
- Ingredient:
  - `item`, `amount`, `unit`, `category`

## System Instruction
System Instruction legt Rollen/Qualität fest:
- 3 definierte Stile (Student/Profi/Airfryer)
- Kategorien konsistent auf Deutsch (z.B. Gemüse, Fleisch, Milchprodukte, Vorrat)

## Fehlerbehandlung
- Service loggt `console.error("Gemini API Error:", error)` und wirft weiter.
- UI zeigt generischen `alert(...)`.

## Hinweise / Limits
- API Key ist im Browser: nicht als „Secret“ behandeln.
- „Social Link“ macht keinen HTTP-Fetch; es ist nur Kontext im Prompt.
