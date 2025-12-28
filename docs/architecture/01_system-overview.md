# Systemübersicht

Dieses Dokument gibt einen Gesamtüberblick über die Softwarearchitektur von Chefmate AI.

## Zielsetzung
Chefmate AI ist eine moderne Webanwendung, die Nutzern KI-gestützte Rezeptvorschläge, Essensplanung und Einkaufshilfen bietet. Die Kernfunktionalität basiert auf der Integration des Google Gemini AI-Modells.

## Hauptkomponenten
- **Frontend:** React 19, TypeScript, Vite, Tailwind (CDN)
- **Backend:** Kein eigenes Backend, API-Aufrufe direkt aus dem Frontend
- **KI-Integration:** Google Gemini API (über @google/genai)
- **Datenhaltung:** Client-seitiger State (kein Server, keine DB)
- **Build/Dev:** Vite, npm, .env.local für Secrets

## Architekturdiagramm
```
[Browser]
   |
   | React + Vite
   v
[Chefmate App (SPA)]
   |
   | REST/HTTP
   v
[Google Gemini API]
```

## Hauptablauf
1. Nutzer gibt Anfrage ein (z.B. "Lasagne")
2. Frontend sendet Prompt an Gemini API
3. Antwort wird normalisiert und als Rezept angezeigt
4. Nutzer kann Rezepte speichern, planen, einkaufen

## Sicherheit
- API-Key nur in .env.local, nie im Repo
- Keine Speicherung sensibler Daten

## Besonderheiten
- Keine Serverkomponente nötig
- Schneller Build/Reload durch Vite
- KI-Logik komplett im Frontend
