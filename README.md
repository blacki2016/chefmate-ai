<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1crNPolQpoRAZbzMxFDaB64LNguLgf6Vx

## Run Locally

**Prerequisites:**  Node.js, Vercel CLI (`npm install -g vercel`)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Link to Vercel project (one-time):
   ```bash
   vercel link
   ```

3. Pull Vercel environment variables:
   ```bash
   vercel env pull .env.local
   ```
   (This will populate `.env.local` with `GEMINI_API_KEY` from your Vercel Dashboard.)

4. Run the app locally with full API support:
   ```bash
   npm run dev
   ```
   This starts both the Vite frontend (port 5173) and Vercel Functions (port 3000) locally.

## Deployment

Deploy to Vercel:
```bash
vercel deploy
```

### Required Environment Variable

- **`GEMINI_API_KEY`**: Your Gemini API key from [Google AI Studio](https://ai.google.dev/aistudio).
  - Set in Vercel Dashboard → Project Settings → Environment Variables.
  - Required for Production, Preview, and Development environments.
  - **Important:** Never use `VITE_` prefix; this variable must stay server-side only.
