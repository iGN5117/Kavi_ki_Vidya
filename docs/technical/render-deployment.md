# Render Backend Deployment

Kavi ki Vidya uses Supabase for persistence and a Node API for AI speech work. The APK calls the public Render URL, and the Render service keeps OpenAI and Supabase service-role secrets server-side.

## Service

- Platform: Render Web Service
- Blueprint: `render.yaml`
- Build command: `npm ci`
- Start command: `npm run server`
- Health check: `/health`
- Runtime: Node 20

## Required Render Environment Variables

Set these in Render. Do not add them to the mobile app or EAS public environment.

```bash
OPENAI_API_KEY=...
SUPABASE_URL=https://jambfvfvrgfewgjnwuqp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PROGRESS_STORAGE_PROVIDER=supabase-rest
SUPABASE_PROGRESS_TABLE=learner_progress
```

The blueprint supplies safe defaults for the OpenAI model names and Supabase table name, but Render still needs the secret values above.

## Deploy Steps

1. Push the repo to GitHub.
2. In Render, create a new Blueprint from the repo, or create a Web Service manually using the commands above.
3. Add the required environment variables.
4. Deploy and wait for `/health` to return `ok: true`.
5. Copy the public Render service URL, for example `https://kavi-ki-vidya-api.onrender.com`.
6. Add the URL to EAS preview:

```bash
npx eas-cli@latest env:create preview --name EXPO_PUBLIC_API_BASE_URL --value https://YOUR_RENDER_URL/api --visibility plaintext --force --non-interactive
npx eas-cli@latest env:create preview --name EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT --value https://YOUR_RENDER_URL/api/realtime/session --visibility plaintext --force --non-interactive
```

7. Build a new APK:

```bash
npx eas-cli@latest build --platform android --profile preview --non-interactive
```

## Verification

After deploy, open:

```text
https://YOUR_RENDER_URL/health
```

Expected fields:

- `ok: true`
- `openAIConfigured: true`
- `progressStorage.provider: "supabase-rest"`
- `progressStorage.productionReady: true`
