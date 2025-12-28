# Gemini-API-Integration

## Ziel
Nutzung des Google Gemini AI-Modells zur Generierung von Rezepten und Texten.

## Bibliothek
- @google/genai

## API-Key Handling
- Nur in `.env.local` als `VITE_GEMINI_API_KEY`
- Niemals im Repo oder im Build

## Service-Layer
- `src/services/geminiService.ts`
- Prompt-Generierung, Model-Handling, Fehlerbehandlung
- Fallback auf stabiles Modell
- Schema-Normalisierung der KI-Antwort

## Ablauf
1. Prompt wird an Gemini gesendet
2. Antwort wird validiert und normalisiert
3. Fehler werden abgefangen und im UI angezeigt

## Sicherheit
- Key nie im Client-Build sichtbar (Vite: nur VITE_ Variablen)
- Keine Speicherung von Nutzerdaten
