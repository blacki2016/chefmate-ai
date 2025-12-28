# ChefMate AI – Architektur (Übersicht)

## Zweck
ChefMate AI ist eine clientseitige React/Vite-App, die aus Nutzer-Inputs (Text, „Vorrat“-Liste, Bild-Scan, Social-Link-Text) ein Rezept generiert und es in drei Varianten darstellt:
- **student** (einfach/günstig)
- **profi** (authentisch/gourmet)
- **airfryer** (geräteoptimiert)

Zusätzlich bietet die App:
- Wochenplan (Breakfast/Lunch/Dinner)
- Einkaufsliste (Zutaten-Aggregation + Abhaken)

## System-Kontext (hoch-level)
- **Browser (React UI)**: komplette Anwendung läuft im Browser.
- **Gemini API** (über `@google/genai`): direkt aus dem Browser aufgerufen.
- **Kein Backend**: kein eigener Server, keine Datenbank.

## Tech-Stack
- **Runtime/UI**: React 19, TypeScript
- **Build/Dev**: Vite
- **AI SDK**: `@google/genai`
- **Icons**: `lucide-react`
- **IDs**: `uuid`
- **Styling**: Tailwind via CDN in `index.html` (kein Tailwind Build-Step)

## Repository-Struktur (relevante Teile)
- `src/index.tsx`: React Mount
- `src/App.tsx`: Haupt-UI + State + Views
- `src/types.ts`: Domain-Model (Recipe, Planner, Shopping)
- `src/services/geminiService.ts`: Gemini-Integration + Response-Schema
- `src/components/*`: Navigation, RecipeCard
- `vite.config.ts`: Vite-Server/Define/Alias

## Laufzeit-Datenfluss (Kurz)
1. User triggert Generate (Suche, Vorrat, Scan, Social).
2. `App.tsx` ruft `generateRecipe(...)`.
3. `geminiService.ts` baut Prompt + optional Bild-Part + Schema.
4. Gemini liefert JSON (Schema erzwungen), wird geparst.
5. App speichert Rezept in State und zeigt Detailansicht.
6. Optional „Zum Plan hinzufügen“ → Planner + ShoppingList werden aktualisiert.

## Persistenz / Speicherung
- Aktuell **nur In-Memory State** (React `useState`).
- Beim Reload gehen Rezepte/Plan/Einkaufsliste verloren.

## Sicherheits-/Betriebs-Hinweis
- API Key liegt clientseitig vor (Env in Vite, zur Buildzeit injiziert). Das ist ok für Prototyp/MVP, aber kein Secret-Schutz.

## Bekannte Konfig-„Footguns“
- Env-Variablen sind an **`VITE_` Prefix** gebunden, wenn du `import.meta.env` nutzt.
- Gleichzeitig existiert in `vite.config.ts` ein `define` auf `process.env.*` (Legacy/Kompat). Das kann leicht zu Verwirrung führen.

Weiterführend:
- 02 Frontend & State
- 03 Domain & Datenmodell
- 04 Gemini / AI Integration
- 05 Build/Env/Deployment
