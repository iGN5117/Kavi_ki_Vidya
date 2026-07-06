# CTO Technical Review — Implementation Issues & Bugs

Reviewer role: CTO
Date: 2026-07-05
Scope: whole app, with focus on Learn/Speak scoring implementation (per request)

Severity legend: 🔴 bug / correctness, 🟠 design flaw with user-visible impact, 🟡 cost/robustness/hygiene

## 1. Scoring implementation — Learn tab

### 🔴 1.1 Score counts check *events*, not activities, and double-counts retries
[lessonId].tsx:132 `lessonScore = checkedCount ? round(correct/checked*100) : 100`. Every "Check answer" press and every pronunciation stop increments `checkedCount` ([lessonId].tsx:252, 327). Selecting a new option resets `answerChecked` and allows another check for the same activity, so a single activity can contribute 0, 1, or N results. There is no per-activity result record — the score is not reproducible from stored data and not comparable across lessons.

### 🔴 1.2 Answer reveal + re-check inflates the score
On a wrong check, the correct option is highlighted (`revealedCorrectOption`, [lessonId].tsx:435, and equivalents in every activity type). The learner can then select the revealed answer and check again; that second check counts as correct. Combined with 1.1, the score is trivially gameable.

### 🔴 1.3 Empty denominator defaults to 100%
`checkedCount === 0 → lessonScore = 100`. A lesson made only of listen/repeat steps that error out server-side completes with a recorded `LessonAttempt.score` of 100.

### 🔴 1.4 Client pass threshold (82) contradicts server verdict thresholds
[lessonId].tsx:328 counts `result.score >= 82` as correct. The server's "clear" verdict requires ≥ 88 (transcript fallback, dev-server.js:1867) or ≥ 86/90 (audio mode, dev-server.js:1896). Scores 82–87 are counted correct while displaying a "practice again" verdict. Related magic numbers: 82 again in conversation.tsx:722, 85 in dev-server.js:1017/1446/1505 and sampleFeedback.ts:221/254. There is no shared threshold constant anywhere.

### 🔴 1.5 Learn tab hard-blocks offline / server-down
For `sentence`/`speak` activities, `canContinue` requires `repeatedConfirmed`/`spokenConfirmed` ([lessonId].tsx:110-114), which are only set after a *successful* `checkLessonPronunciation` round-trip ([lessonId].tsx:317-326). If the practice API is unreachable, the check throws, the flags stay false, and the lesson cannot be completed — there is no skip/continue-anyway fallback on the error path. The requirements say Learn is core; it currently has a hard runtime dependency on the dev server.

### 🟠 1.6 One lesson-level score drives per-item review scheduling
useAppStore.ts:592 computes `getReviewSchedule(lessonAttempt.score)` once and applies the same `dueAt`/`priority` to every review prompt from the lesson. Failed items inside a high-scoring lesson get deprioritized 3-day scheduling. Schedule should be derived per item from that item's outcome.

### 🟡 1.7 Model audio lost between consecutive identical sentences
The audio-loading effect is keyed on `targetSentence` ([lessonId].tsx:139-178) but `resetInteractionState()` nulls `modelAudioUrl` on every `next()`. If two consecutive activities share the same target sentence, the effect does not re-run and the second activity has no model audio (button stays disabled).

## 2. Scoring implementation — Speak tab

### 🔴 2.1 Free-chat transcript-target scoring is circular
dev-server.js:2585-2588: with no `expectedText`, `expectedText = transcript`. Consequences:
- `localPronunciationCheck(transcript, transcript)` — the fallback and the `transcriptScore` fed into the strict outcome — is a word-overlap of a string with itself: **always 100**.
- In transcript-only fallback mode (audio model unavailable/unconvertible), the final free-chat score is therefore always 100/"clear" regardless of what was said.
- Even in audio mode, ASR normalization means the "expected sentence" shown to the assessor is a cleaned-up version of the learner's speech, biasing the word-level judgment upward.

### 🔴 2.2 Client-side re-check misclassifies the target source (and doubles cost)
conversation.tsx:544-546: when `/voice/turn` returns no pronunciation, the client re-uploads the same audio to `/pronunciation/check` with `expectedText = practiceDrill?.prompt || result.transcript`. That endpoint hardcodes `targetSource: "provided-target"` (dev-server.js:2404), so a plain transcript gets the **strict known-target** scoring branch (caps at 84/69 on transcript match, tighter clarity/sound floors) — the opposite branch from what `/voice/turn` itself would choose (`transcript-target`, dev-server.js:2587). Same input, two different scoring regimes depending on which code path ran. It also runs transcription + audio assessment a second time for the same clip: ~2× OpenAI cost and latency on that path.

### 🔴 2.3 Demo modes return fabricated results in the real-score UI
- `/api/pronunciation/check` without OpenAI: `localPronunciationCheck(expectedText, expectedText)` → always 100/clear (dev-server.js:2365-2371).
- `/api/voice/turn` without OpenAI: hardcoded transcript `"I want talk teacher."` (dev-server.js:2546) shown as if the learner said it.
Demo results carry `isDemo`, but the lesson screen and drill outcome logic never check it — demo scores enter `lessonAttempts`, review scheduling, and drill outcomes as real data.

### 🔴 2.4 `score <= 1 ? score * 100 : score` normalization bug (4 sites)
conversation.tsx:720, sampleFeedback.ts:211, sessionReceipt.ts:39 and :116. A genuine score of 1 (or 0.5 on a 0–100 scale) is multiplied by 100. A learner scoring 1% displays as 100%. Either the API contract is 0–100 (it is — server clamps to 0–100) and this heuristic should be deleted, or the contract is ambiguous and should be fixed at the boundary once, not guessed at in four places. Note the server-side aggregator (dev-server.js:1419-1425) does *not* apply this normalization — client and server disagree on the same data.

### 🔴 2.5 Drill "score" can silently be the confidence heuristic
conversation.tsx:714-719 falls back from `feedback.pronunciation.score` to `feedback.confidence.score`. In local-fallback feedback, confidence is `min(94, 66 + turns*6)` (dev-server.js:1484, sampleFeedback.ts:333) — a participation counter. That number then drives the drill outcome ("improved" at ≥ 82 — i.e. after 3 turns, automatically) and is persisted in `drillResults`, which feeds the adaptive practice plan.

### 🟠 2.6 Strict-outcome machinery is unvalidated tuning on noisy inputs
`getStrictPronunciationOutcome` (dev-server.js:1906-1968) layers ~8 env-tunable thresholds, 6 cap rules, and a weighted blend on top of component scores (clarity/soundAccuracy/rhythm) that come from a **non-deterministic LLM judgment** with no calibration set. `transcriptWeight` is 0.04–0.08 — cosmetically present but dominated by the hard caps. There is no golden-audio eval to detect drift when the model or prompt changes; scripts/verify-speak-regressions.js asserts flags, not score behavior. Recommend: a small fixture set of recordings with expected bands, run in CI against the scoring function with mocked assessment outputs, plus periodic live calibration.

## 3. Other implementation issues

### 🔴 3.1 Wasted paid OpenAI Realtime session on every mic press
conversation.tsx:460: `void withTimeout(createRealtimeSession(instructions), 1200).catch(() => undefined)` — fires `/api/realtime/session`, which POSTs to OpenAI `v1/realtime/sessions` (dev-server.js:2432), and discards the result. Nothing in the turn-based flow consumes it. This creates a billable Realtime session per recording start. Delete it (or actually use it for warm-up if that was the intent — 1.2 s timeout suggests a leftover connectivity probe).

### 🔴 3.2 All users collapse into one sync profile
useAppStore.ts:411-413: `getSafeSyncIdForProvider(provider, providerUserId)` ignores both arguments and returns `getDefaultSyncProfileId()`. Every sign-in maps to the same profile id, so two devices/users would merge progress via `mergeProgressSnapshots`. Acceptable for a single-user prototype; a data-corruption landmine the moment a second account exists (Supabase backend is already selected per project decisions).

### 🟠 3.3 No auth/rate limiting on expensive endpoints
`/api/voice/turn`, `/api/pronunciation/check`, `/api/feedback/session`, `/api/audio/sentence` accept unauthenticated uploads and each fan out to paid OpenAI calls (up to 4 per voice turn). Fine on localhost; the repo also contains render.yaml / a Render deployment path, where this becomes an open cost proxy. At minimum add a shared secret header and per-IP rate limits before deploying.

### 🟠 3.4 Session feedback posts uncompacted turn objects
`generateSessionFeedback` sends the full `turns` array (realtimeClient.ts:434-453), including every `pronunciation` object and coach `audioUrl` fields, while the voice path carefully compacts to 8 turns / clamped fields (`getCompactVoiceTurns`, realtimeClient.ts:68-91). Long sessions inflate the feedback prompt (cost + latency) and the previous "long speak history" bug suggests this path has bitten before. Reuse the compactor.

### 🟡 3.5 Daily-minutes bookkeeping loses data
- `applyDailyActivity` caps `minutesToday` at `dailyGoalMinutes` (useAppStore.ts:335) — actual practice minutes beyond the goal are unrecorded, so future analytics/goal tuning can't see real usage.
- Every speaking session credits a flat 3 minutes (useAppStore.ts:657) regardless of duration; lessons credit `lesson.durationMinutes`, not elapsed time.

### 🟡 3.6 Dead / duplicated code
- `getRoleplayProgress` (conversation.tsx:741-760) is defined and never used.
- The 24-line recording-options object is duplicated verbatim in [lessonId].tsx:29-52 and conversation.tsx:55-78.
- `personalizeFeedbackWithTurnPronunciation` + grammar-fix pipeline exist in near-identical client (sampleFeedback.ts) and server (dev-server.js:1491-1557) versions — a known parallel-rules maintenance hazard (they have already drifted: see 2.4 normalization).
- `uniqueFeedback` dedupes by `JSON.stringify` (useAppStore.ts:148-160); receipts contain timestamps, so it never dedupes in practice.

### 🟡 3.7 Misc
- `withTimeout` (conversation.tsx:80-89) rejects but doesn't abort the underlying fetch; slow uploads keep running in background.
- `getSafeSyncIdForProvider`'s unused params and `getRealtimeCallEndpoint`-style string surgery on the configured endpoint (realtimeClient.ts:100-157) are brittle — a base-URL + route map would remove three copies of the `/api/realtime/session` suffix parsing.
- The lesson complete screen claims "Your streak has started for today" ([lessonId].tsx:368) unconditionally, even if the goal/streak state says otherwise.

## 4. Recommended fix order

1. **2.1 + 2.2 + 1.4** — one shared scoring contract: a single thresholds module used by client & server; free chat scored as `transcript-target` everywhere or not numerically scored at all; delete the client-side re-check or pass the correct target source.
2. **1.1–1.3** — per-activity first-attempt results in Learn; score derived from them; remove the 100% default.
3. **2.3 + 2.5** — mark demo/fallback results unscored; never let heuristics enter `drillResults`/`lessonAttempts`.
4. **3.1** — delete the throwaway realtime-session call (immediate cost win, one line).
5. **1.5** — allow continue-after-failure in lessons when the pronunciation service errors.
6. **3.2 + 3.3** — before any real deployment: real per-user sync ids, endpoint auth, rate limits.
7. **2.4 / 3.4 / 3.6** — cleanup pass: normalization at the API boundary, compacted feedback payload, dedupe shared logic.
