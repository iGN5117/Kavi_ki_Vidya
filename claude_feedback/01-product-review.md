# Product Review — Effectiveness as an English-Learning App

Reviewer role: Product Manager
Date: 2026-07-05
Scope: Learn and Speak tabs, with focus on scoring (per request)

## 1. Overall assessment

The product concept is strong and unusually well-matched to its persona (Indian homemakers, absolute beginners in spoken English, Hindi/Hinglish support). The core loop — short lesson → speaking practice → review queue → adaptive recommendation — is the right shape, and several details are genuinely good: skip-with-overview, Devanagari + Hinglish explanation toggle, per-turn coach narration of the corrected sentence, and the session receipt that converts a conversation into one "best sentence / one fix / one retry sentence."

The weakest part of the product is exactly what you suspected: **the scoring system**. Scores are shown prominently everywhere (lesson complete screen, per-turn pronunciation cards, drill results, session feedback), but the numbers do not measure a stable, consistent thing. They mix accuracy, persistence, participation, and in some paths are outright fabricated or structurally guaranteed to be high. For a nervous beginner, an untrustworthy score is worse than no score.

## 2. Scoring effectiveness — Learn tab

The lesson score is `correctCount / checkedCount` over *check events*, not over *activities* ([lessonId].tsx:132).

Problems, in order of severity:

1. **It punishes exactly the behavior you want.** A learner who gets an item wrong, reads the explanation, and retries until correct performs the ideal learning behavior — and ends with 50% for that item. A learner who quits after one wrong check gets the same 50%. A learner who never retries pronunciation scores higher than one who retries to mastery ([lessonId].tsx:327-333 adds every retry to the denominator). The score is anti-correlated with persistence.
2. **It can be gamed without learning.** After a wrong check, the UI reveals the correct option (`revealedCorrectOption`, [lessonId].tsx:435). The learner can then tap the revealed answer and check again, which counts as a correct check. So the score neither rewards mastery nor resists inflation — it's noisy in both directions.
3. **A lesson with no checkable activities scores 100%** (`checkedCount ? … : 100`). "Lesson score: 100%" for passive listening is a false mastery signal.
4. **The pronunciation "correct" threshold (≥ 82) disagrees with the verdict the learner sees.** A score of 85 shows "Good try. Practice once more" (practice-again verdict) while silently counting as correct for the lesson score. The learner sees a mixed message: the coach says retry, the score says you passed.
5. **One aggregate score schedules all review items.** `getReviewSchedule(lessonAttempt.score)` (useAppStore.ts:232-236, 592-605) assigns the same due date and priority to every review prompt from the lesson. An item you failed inside a 90% lesson gets "low priority, review in 3 days" — the opposite of what spaced repetition needs. Review scheduling should be per-item, keyed to that item's outcome.

**What the Learn score should be:** first-attempt accuracy per activity (one binary result per item), stored per item. That gives you: an honest lesson score (items right first try / items), correct SRS inputs, and a mastery signal per skill tag (you already have `lessonSkillProfiles` — the data model is ready for this, the scoring isn't).

## 3. Scoring effectiveness — Speak tab

This is the more serious problem, because the Speak score is presented as the app's most authoritative signal ("Deep audio scoring") while being structurally unreliable in the most common mode.

1. **Free-chat scoring is circular.** In free chat there is no target sentence, so the server uses the ASR transcript as the expected text (dev-server.js:2585-2588). The transcript-match component compares the transcript to itself — always 100%. Worse, Whisper-class ASR *autocorrects*: if the learner says "I want talk teacher," the transcript often comes back cleaned up, so the "target" is a polished version of what was actually said. The per-turn card then shows "Words: 100%" essentially always. In transcript-only fallback mode the whole score is that comparison, so **free-chat fallback scores are always ~100 and always "clear."**
2. **Demo modes fabricate results.** With no OpenAI key, `/api/pronunciation/check` scores the expected text against itself — always 100/clear (dev-server.js:2365-2371) — and `/api/voice/turn` returns a hardcoded transcript "I want talk teacher." (dev-server.js:2546). A learner on a demo build gets pure fiction presented in the same UI as real scores.
3. **Fallback session feedback invents scores from turn counts.** `min(92, 68 + turns × 4)` for pronunciation and `min(94, 66 + turns × 6)` for confidence (dev-server.js:1456, 1484; duplicated in sampleFeedback.ts:304, 333). These are participation counters displayed as percentage scores. Confidence-as-participation is defensible if labeled honestly; pronunciation-as-participation is not.
4. **Whiplash between modes.** Free chat effectively can't score low; drill mode (known target) applies strict caps (transcript < 85 caps score at 84, < 70 caps at 69, plus component caps — dev-server.js:1906-1968). The same learner saying the same sentence can get 95% in free chat and 62% in a drill. Without explanation, this reads as the app being moody, and for a confidence-sensitive persona that's actively harmful.
5. **The session score is a plain average across turns** (dev-server.js:1428-1431), mixing free-chat intelligibility scores with drill-target scores and weighting a shaky first attempt the same as a strong final one. It hides improvement — the one story a learner most wants to see.
6. **Drill outcomes upgrade themselves.** `outcome = score ≥ 82 ? "improved" : learnerTurnCount > 1 || score ≥ 60 ? "practiced" : "needs-retry"` (conversation.tsx:721-722). Speaking *more turns* upgrades the outcome regardless of quality, and the score used here can silently be the confidence participation heuristic when no pronunciation score exists (conversation.tsx:714-719). "Improved" should mean the target was said better than before; nothing compares against a prior attempt.
7. **Threshold sprawl destroys score meaning.** Correct/clear lives at ≥82 (lesson), ≥85 (server coach logic, feedback clearing), ≥88 (transcript verdict), ≥86/≥90 (audio clear thresholds, free vs known target), plus ~8 env-tunable caps. No single place defines what a number means, so the number means nothing.

**What the Speak score should be:**
- **Only score against known targets.** In drills and lesson repeats, score strictly (current strict pipeline is directionally right). In free conversation, drop the per-turn percentage entirely — show intelligibility as a verdict ("I understood you" / "Say that once more") and save the numbers for drills. This also removes the circular transcript-target problem and cuts one expensive audio-assessment call per free-chat turn.
- **One threshold table**, shared by client and server, versioned, with named bands (e.g. clear ≥ 85, developing 65–84, retry < 65). Never let the client hardcode 82 while the server says 90.
- **Never fabricate.** If scoring is unavailable (demo, fallback, error), show "no score this time" — the UI already has verdict-only affordances.
- **Score deltas, not levels, for drills.** Store the previous score per review item (the review queue already tracks `practiceCount`/`lastResult`) and report "68 → 84" — that's the motivating number for this persona.

## 4. Beyond scoring — product gaps worth noting

- **No placement or level adjustment.** Everyone starts at greetings-intro. An "already knows some English" learner will churn in module 1. Even a 3-question self-assessment would help.
- **Free chat contradicts its own promise.** The Speak hub says "Corrections come mostly after the session" (speak/index.tsx:17), but every turn renders a dense pronunciation assessment card. Pick one: either flow-first conversation with end-of-session receipt (recommended for this persona), or per-turn drilling — currently it's both, and conversation rhythm dies.
- **Extra practice isn't recognized.** `minutesToday` is capped at the daily goal (useAppStore.ts:335), and every speaking session credits a flat 3 minutes regardless of length (useAppStore.ts:657). Learners who exceed their goal see no acknowledgment; the goal ring can never overfill.
- **Live conversation is the top CTA** on the Speak hub while it's the least stable feature (paused pending device testing per project history). The most reliable, most differentiated mode — turn-based coached conversation — is the third button.
- **The default identity is hardcoded** ("Kavita", useAppStore.ts:103) — fine for a prototype, but every scoring/streak decision above should be validated with more than one test persona before broadening.

## 5. Priority recommendations

1. Fix score semantics (Learn: first-attempt per-item; Speak: known-target-only percentages, verdict-only in free chat). This is the highest-leverage change in the app.
2. Unify thresholds into one shared config; remove the 82/85/88/90 disagreement.
3. Stop fabricating scores in fallback/demo paths; label unscored turns as unscored.
4. Make review scheduling per-item, and make "improved" mean improved (delta vs. last attempt).
5. Move free-chat corrections to the session receipt; keep per-turn cards for drills only.
