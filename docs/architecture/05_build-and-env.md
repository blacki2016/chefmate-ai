# Build, Environment & Sicherheit

## Build-Prozess
- Vite als Dev-Server und für Production-Build
- npm scripts: `dev`, `build`, `preview`
- Keine eigenen Backend- oder Build-Skripte nötig

## Environment Handling
- `.env.local` für Secrets (API-Key)
- `.env.example` als Vorlage
- `.gitignore` schützt Secrets
- Nur Variablen mit `VITE_` werden geladen

## Sicherheit
- API-Key nie im Repo
- Keine Speicherung von Nutzerdaten
- Keine Server- oder DB-Komponenten

## Deployment
- Statischer Build (`dist/`)
- Kann auf jedem statischen Hoster laufen (z.B. Vercel, Netlify)

## Troubleshooting
- Port-Chaos vermeiden: Nur ein Vite-Dev-Server gleichzeitig
- Bei API-Fehlern: Key prüfen, Console-Error posten
