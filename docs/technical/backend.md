# Kavi ki Vidya Backend Notes

Status: local prototype scaffold
Date: 2026-04-29

## Local Dev Server

Run the prototype API with:

```sh
npm run server
```

Verify the local API contract while the server is running with:

```sh
npm run verify:local-api
```

The verifier checks `/health`, invalid progress request failures, and progress `PUT`/`GET` round-tripping against `http://127.0.0.1:8787` by default. Override the target with `LOCAL_API_BASE_URL`, `API_BASE_URL`, or `EXPO_PUBLIC_API_BASE_URL`.

The dev server listens on `PORT`, defaulting to `8787`, and exposes these local routes:

- `GET /health`: reports server readiness, OpenAI availability, and the active progress storage adapter.
- `POST /api/realtime/session`: mints an OpenAI Realtime ephemeral session when `OPENAI_API_KEY` is configured.
- `POST /api/voice/turn`: accepts one learner audio turn and returns transcript, coach reply, support text, and optional coach audio.
- `POST /api/text/turn`: accepts one learner text turn and returns coach reply, support text, and optional coach audio.
- `POST /api/feedback/session`: returns structured speaking feedback for a session. `pronunciation.score` and `pronunciation.tips` are additive optional fields for clients.
- `GET /api/progress/:profileId`: pulls the latest local prototype progress snapshot.
- `PUT /api/progress/:profileId`: stores a sanitized local prototype progress snapshot.

Progress snapshots use the repository adapters in `server/progress-store.js`. The default `file-json` adapter stores local development data under `server/tmp/progress`. The optional `supabase-rest` adapter stores the same records in a Supabase/PostgREST table without changing the mobile app contract.

## Environment Variables

Use `.env.example` as the local contract:

- `PORT`: local API port, default `8787`.
- `OPENAI_API_KEY`: server-only OpenAI key. Never expose this in the mobile app.
- `OPENAI_REALTIME_MODEL`, `OPENAI_REALTIME_VOICE`, `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_AUDIO_ASSESSMENT_MODEL`, `OPENAI_TEXT_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE`: server-side model and voice overrides. `OPENAI_AUDIO_ASSESSMENT_MODEL` defaults to `gpt-audio-1.5`.
- `PROGRESS_STORAGE_PROVIDER`: `file-json` by default. Set to `supabase-rest` to use the Supabase adapter.
- `SUPABASE_URL`: server-only Supabase project URL for `supabase-rest`.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service role key for `supabase-rest`. Never expose this in the mobile app.
- `SUPABASE_PROGRESS_TABLE`: progress table name for `supabase-rest`, default `learner_progress`.
- `EXPO_PUBLIC_SUPABASE_URL`: public Supabase project URL for mobile auth/bootstrap.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public Supabase publishable key for mobile auth/bootstrap. This is safe to bundle, unlike the service role key.
- `EXPO_PUBLIC_API_BASE_URL`: public mobile API base URL, for example `http://localhost:8787/api`.
- `EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT`: public mobile endpoint for Realtime session minting, for example `http://localhost:8787/api/realtime/session`.
- `EXPO_PUBLIC_SYNC_PROFILE_ID`: local prototype profile identifier, for example `local-kavita`.

Only `EXPO_PUBLIC_*` values are bundled into the Expo app. Supabase URL and publishable key are intentionally public. Do not put service role keys, API keys, bearer tokens, database passwords, or signing secrets in those values.

The Expo mobile Supabase client helper lives in `src/services/supabase/client.ts`. It uses `@supabase/supabase-js` with `AsyncStorage` session persistence and `react-native-url-polyfill` for native URL support. The Next.js `@supabase/ssr` helpers are not used in the mobile app.

Google OAuth and Apple Sign In are intentionally out of scope for the current production-ready path. The mobile app uses one local learner profile and persists that learner's data through Supabase-backed progress sync.

## Voice Audio Assessment

Transcription accepts the native recording formats produced by the mobile clients. Deep pronunciation scoring is stricter because the OpenAI audio assessment call accepts only WAV or MP3 audio input. The server therefore uses this flow:

- WAV and MP3 uploads are sent to the audio assessment model directly.
- Android M4A/MP4/AAC-style uploads are decoded server-side with `ffmpeg-static` into mono 16 kHz PCM WAV, then sent for deep scoring.
- The conversion avoids an additional lossy encode; Android's original AAC/M4A capture is already compressed, and the server decodes it to WAV for model compatibility.
- If conversion fails or the uploaded format is unsupported, the API keeps the session usable by falling back to transcript-only pronunciation scoring and returning that scoring mode to the app.

This keeps the Android APK on a native mobile recording format while preserving deep scoring on the backend.

## Progress Sync Contract

The current sync scaffold is local-only, but it now mirrors the production shape: the app creates a bearer session from the current auth profile, then uses that session for progress reads and writes.

```http
POST /api/auth/dev-session
Content-Type: application/json

{
  "authProfile": {
    "provider": "local",
    "providerUserId": "kavita-local",
    "syncProfileId": "local-kavita",
    "displayName": "Kavita",
    "signedInAt": "2026-04-29T09:00:00.000Z"
  }
}
```

The response includes a short-lived local bearer token, `userId`, `profileId`, provider metadata, `issuedAt`, and `expiresAt`. This is a lightweight local learner session for the current no-OAuth production path.

```http
GET /api/progress/local-kavita
PUT /api/progress/local-kavita
Authorization: Bearer <local-dev-session-token>
Content-Type: application/json

{
  "progress": {
    "isSignedIn": true,
    "hasCompletedOnboarding": true,
    "authProfile": {
      "provider": "local",
      "providerUserId": "kavita-local",
      "syncProfileId": "local-kavita",
      "displayName": "Kavita",
      "signedInAt": "2026-04-29T09:00:00.000Z"
    },
    "name": "Kavita",
    "explanationPreference": "both",
    "dailyGoalMinutes": 5,
    "streakCount": 1,
    "minutesToday": 3,
    "dailyProgressDate": "2026-04-29",
    "lastActiveDate": "2026-04-29",
    "completedLessons": [],
    "skippedLessons": [],
    "skippedModules": [],
    "lessonAttempts": [],
    "reviewQueue": [],
    "drillResults": [],
    "savedPhrases": [],
    "mistakes": [],
    "feedbackHistory": []
  }
}
```

Progress writes must use the wrapper shape above. Invalid profile IDs, missing `progress`, non-object `progress`, and known fields with the wrong JSON type return `400` with a clear error message. Unknown progress fields are ignored rather than stored. Requests without a bearer token still work as a local legacy fallback, but requests with a bearer token are checked against the session `profileId`.

Responses include:

- `profileId`: sanitized local profile ID.
- `progress`: sanitized progress snapshot.
- `updatedAt`: server write timestamp, or `null` before the first write.
- `revision`: local monotonically increasing integer.
- `ownerUserId`: session user ID for authenticated writes, or `null` for legacy writes.
- `authProvider`: auth provider for authenticated writes, or `null` for legacy writes.
- `source`: `local-session-storage` for bearer-session progress, or `local-dev-storage` for the legacy local fallback.

`GET /health` also returns:

```json
{
  "progressStorage": {
    "provider": "file-json",
    "location": "server/tmp/progress",
    "productionReady": false,
    "supportsAuthScopedRecords": true
  }
}
```

When `PROGRESS_STORAGE_PROVIDER=supabase-rest`, the provider changes to `supabase-rest` and the route contract stays the same.

Suggested Supabase table:

```sql
create table if not exists learner_progress (
  profile_id text primary key,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  revision integer not null default 0,
  owner_user_id text,
  auth_provider text,
  last_write_source text
);
```

For production, keep this table behind server-side access only or add row-level security policies that map real authenticated users to `owner_user_id`.

The mobile helper lives in `src/services/sync/progressSync.ts` and exposes:

- `hasProgressSyncEndpoint()`
- `getDefaultSyncProfileId()`
- `pullProgress(profileId?)`
- `pushProgress(progress, options?)`

The local session client lives in `src/services/auth/sessionClient.ts` and exposes:

- `createDevSession(authProfile)`
- `getCurrentSession(sessionToken)`

The Zustand app store now uses this helper as a non-blocking sync layer:

- AsyncStorage hydrates first so the app can start offline.
- A local bearer session is minted from the normalized auth profile before authenticated sync.
- If a progress endpoint is configured, the store pulls remote progress and merges it with local progress.
- Auth profiles are normalized locally and choose the progress profile ID, with `local-kavita` as the fallback.
- Progress-changing actions debounce a remote push after local save.
- The Profile tab shows sync status and offers a manual `Sync now` action.

If the local API is unavailable, the store falls back to local-only behavior and keeps the learner moving.

## Input Limits And Sanitization

The dev server applies basic prototype protections:

- JSON request bodies are limited to `128kb`.
- Audio uploads are limited to `15mb`.
- Progress `profileId` must be 1-64 characters and contain only letters, numbers, underscore, or hyphen.
- Auth bearer sessions are kept in memory by the dev server and expire after 24 hours.
- Bearer-authenticated progress requests can only access the session `profileId`; mismatches return `403`.
- Progress `PUT` bodies must be JSON objects with a `progress` object.
- Known progress fields are type-checked before sanitization; malformed known fields return `400`.
- Progress writes keep only the known prototype progress fields.
- The progress repository records `ownerUserId`, `authProvider`, revision, and last write source next to the sanitized progress payload.
- `authProfile` is an optional object with local learner metadata and a sanitized `syncProfileId`.
- `lessonAttempts`, `reviewQueue`, `drillResults`, and `feedbackHistory` are flexible prototype JSON arrays, bounded and recursively sanitized before writing.
- Strings, arrays, dates, numbers, feedback history depth, and item counts are bounded before writing to disk.
- Speaking feedback may include optional `pronunciation.score` from 0-100 and `pronunciation.tips` as short strings. Older clients can continue reading only `summary` and `retryWords`.

These checks reduce accidental local damage, but they are not a production security model.

## Production Deployment Notes

Before replacing local sync with a production backend:

- Add real multi-user auth only if public accounts become a requirement. For now, keep the local learner profile and Supabase-backed persistence model.
- Switch `PROGRESS_STORAGE_PROVIDER=supabase-rest` after creating the table and adding server-side Supabase secrets.
- Add explicit schema validation at the API boundary.
- Add optimistic concurrency or merge semantics for multi-device sync.
- Add rate limiting, request logging, and observability.
- Serve over HTTPS only.
- Keep OpenAI and database secrets in server-side secret storage.
- Add automated integration tests for progress read/write and voice/text route regressions.
