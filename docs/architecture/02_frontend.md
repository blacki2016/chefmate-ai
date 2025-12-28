# Frontend-Architektur

## Tech-Stack
- React 19 (SPA)
- TypeScript (strict)
- Vite (Dev-Server, Build)
- Tailwind CSS (CDN)
- lucide-react (Icons)
- uuid (IDs)

## Hauptdateien
- `src/App.tsx`: Hauptkomponente, Routing, State
- `src/index.tsx`: Einstiegspunkt
- `src/components/Navigation.tsx`: Navigation
- `src/components/RecipeCard.tsx`: Rezeptanzeige
- `src/services/geminiService.ts`: KI-Integration
- `src/types.ts`: Domänenmodelle

## State-Management
- React useState/useEffect
- Kein Redux/MobX nötig

## UI/UX
- Responsive Design
- Navigation zwischen Rezept, Planung, Einkauf
- Fehler- und Ladeanzeigen

## Build & Dev
- Vite für schnelles HMR
- npm scripts: `dev`, `build`, `preview`
- .env.local für Secrets

## Besonderheiten
- Keine Backend-Logik
- API-Aufrufe direkt aus dem Frontend
