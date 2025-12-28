# Build, Konfiguration, Env, Betrieb

## Vite
- Dev/Build/Preview Scripts in `package.json`:
  - `npm run dev`
  - `npm run build`
  - `npm run preview`

### Port
- `vite.config.ts` setzt `server.port = 3000` und `host = 0.0.0.0`.
  - Wenn du `npm run dev` ohne Args startest, ist die Standard-URL typischerweise `http://localhost:3000/`.
  - `5173` ist Vite-Default, wenn kein Port gesetzt ist.

### Alias
- `@` wird auf Repo-Root gesetzt: `path.resolve(__dirname, '.')`.

### Env / Define
Es existieren aktuell **zwei Env-Mechanismen**:
1) **Client-seitig (empfohlen)**: `import.meta.env.VITE_GEMINI_API_KEY`
2) **Vite define (Legacy)** in `vite.config.ts`:
   - `process.env.API_KEY`
   - `process.env.GEMINI_API_KEY`

Wichtig:
- `src/services/geminiService.ts` nutzt (1).
- `vite.config.ts` lädt Env via `loadEnv(mode, '.', '')` (Prefix leer) und referenziert `env.GEMINI_API_KEY`.

Praktische Empfehlung für Konsistenz:
- Halte dich an `VITE_GEMINI_API_KEY` und nutze `import.meta.env` im Client.
- Wenn du `define process.env.*` nicht brauchst, kann man es später entfernen.

## TypeScript
- App TS-Config: `tsconfig.app.json` (strict, `types: ["vite/client"]`)
- Root TS-Config: `tsconfig.json` enthält u.a. `types: ["node"]` (für tooling/alias)
- Node TS-Config: `tsconfig.node.json` (für Vite config build)

## Styling
- Tailwind via CDN in `index.html`.
- Theme Extend ist inline in `index.html` definiert (chef colors, Inter).
- Keine Tailwind-Konfiguration/Build Pipeline im Repo.

## Deployment
- Build output: `dist/`.
- Da die App im Browser direkt Gemini aufruft, braucht das Hosting nur Static Files.

## Observability/Debug
- Fehler werden in der Browser-Konsole geloggt (Gemini Error).
- UI nutzt `alert` für User-Feedback.
