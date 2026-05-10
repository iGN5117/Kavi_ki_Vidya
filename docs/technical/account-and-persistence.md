# Account And Persistence

Status: Supabase persistence, no external OAuth
Date: 2026-05-02

Kavi ki Vidya currently uses one local learner profile in the mobile app and stores/syncs progress through the backend into Supabase. Google OAuth and Apple Sign In are intentionally out of scope for the current production-ready path.

## Current Account Model

- The app creates a local learner profile with provider `local`.
- The default sync profile ID is `local-kavita` unless overridden by `EXPO_PUBLIC_SYNC_PROFILE_ID`.
- The local API mints a short-lived bearer session from this local profile.
- Progress writes go through the API and are stored in the Supabase `learner_progress` table when `PROGRESS_STORAGE_PROVIDER=supabase-rest`.

## Supabase Persistence

Supabase is the persistence backend for:

- lesson completion
- skipped lessons/modules
- daily goal and streak state
- review queue
- speaking feedback
- saved phrases and mistake notes

The mobile app can use the public Supabase URL and publishable key for client bootstrap, but protected progress writes still go through the backend so service role keys stay server-side.

## Not In Scope For Now

- Google OAuth client IDs
- Apple Sign In entitlements
- OAuth redirect URI setup
- provider token exchange

If multi-user public accounts become a requirement later, use Supabase Auth directly rather than reintroducing separate Google/Apple wiring in the app first.
