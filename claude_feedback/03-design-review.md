# Design Review — UI/UX

Reviewer role: Design expert
Date: 2026-07-05
Scope: Learn and Speak tabs, shared components, theme

## 1. What's working

- **Warm, coherent palette.** The terracotta/teal/cream system (colors.ts) is distinctive, friendly, and appropriate for the persona — it reads "encouraging coach," not "exam app." Semantic use is mostly consistent: teal/`secondarySoft` = correct, `surfaceWarm` = try again, red reserved for the recording state.
- **Design tokens exist and are used.** `colors`, `spacing`, `radii` are imported everywhere; there are almost no raw hex values in screens (one stray `borderRadius: 8` in feedback.tsx:103).
- **Touch targets are generous.** Min heights of 42–50 on options/chips, a 72 px floating mic, 44 px top controls — good for the target user on mid-range Android devices.
- **Accessibility basics are present.** `accessibilityRole`/`accessibilityLabel`/`accessibilityState` on interactive elements, including selected and disabled states, is better than most prototypes.
- **Good interaction patterns:** skip confirmation sheet with an overview of what's skipped; answer options that reveal the correct choice; word-arrange chips with clear used-state; per-activity progress bar with step count.

## 2. Typography — the biggest visual problem

Nearly every text style in the app is `fontWeight: "900"` — titles, eyebrows, prompts, buttons, option text, pills, labels, sentence text ([lessonId].tsx styles, learn/index.tsx, speak screens all follow this). When everything shouts, nothing has hierarchy:

- The learner's eye has no path through a lesson card: prompt, sentence, hint, and buttons all carry the same weight.
- Black-weight text at 13–15 px (e.g. `pronunciationHelpSupport`, score pills) renders muddy on low-DPI Android screens, and heavy weights degrade Devanagari legibility noticeably.
- A `typography.ts` token file exists in the theme but screens hardcode `fontSize`/`fontWeight` locally everywhere — the system exists and is bypassed.

**Recommendation:** define 4–5 named text styles (display / title / body / support / label) with weights 400–700, reserve 800+ for one level (screen titles), and refactor screens to use them. This single change would do more for perceived polish than any color or layout tweak.

## 3. Voice & language of the UI (critical for this persona)

The persona is an absolute beginner in spoken English, yet the UI chrome speaks fluent, sometimes technical English:

- Learn hub: "Your next lesson stays on the active path and skips anything you already passed over" — 15 words, subordinate clause, for a beginner. Summary pills say "Active / Open / Modules done" — internal jargon even a native speaker must decode.
- **Implementation details leak into learner-facing copy:** "Deep audio scoring" / "Transcript-only fallback" ([lessonId].tsx:894), "Local API returned a demo voice reply because OpenAI is unavailable", "Listening with the local API ready" (conversation.tsx connection notes). A homemaker practicing greetings should never see the words API, transcript, fallback, or OpenAI.
- Hindi/Hinglish support is thorough for *content* (MeaningPanel, support lines, pronunciation support) but absent for *navigation and status text* — exactly the text a beginner needs help with. Error messages ("The microphone did not start. Try again.") are English-only.

**Recommendation:** write all status/help strings at a CEFR-A1 level with Hinglish support lines, and map connection states to three learner-safe messages (practicing live / practice mode / can't hear you right now). Keep the diagnostics behind a dev flag.

## 4. Learn tab — lesson flow

- **The completion screen undersells success.** "Good effort" + a bare percentage is the same message at 100% and at 40%. Celebrate differentiated outcomes: perfect run, improved-after-retry, and needs-review deserve different moments. (Also fix the score itself — see product review.)
- **The score breakdown card is data-dense noise.** After each pronunciation check the learner sees: verdict, score pill, summary, support lines, scoring-mode label, "Heard:" transcript, up to 4 component percentages (Audio/Words/Clarity/Rhythm), problem sounds, and up to 3 tips ([lessonId].tsx:881-930). That's ~10 information units for a beginner mid-exercise. Show verdict + one tip + "Heard: …"; collapse the rest behind a "details" toggle.
- **Percentages imply false precision.** "83%" suggests measurement accuracy the pipeline doesn't have. Bands (Clear / Almost / Try again) with a coarse 3–5 segment meter would communicate honestly and reduce anxiety. The verdict labels already exist — lead with them.
- **Progress bar semantics:** progress shows `(index+1)/total` while *on* a step, so it reads 100% before the last activity is answered. Fill on completion of a step, not entry.
- **Feedback placement:** correct/incorrect feedback plus InlineSupport plus MeaningPanel can render simultaneously (e.g. [lessonId].tsx:442-462), showing the same explanation content twice in two visual containers. Pick one container.

## 5. Speak tab — conversation screen

- **Ending a session — the action that produces the app's core reward (feedback) — is a bare checkmark icon** top-right (conversation.tsx:658-674). Icon-only, no label, and a checkmark reads "confirm," not "finish & get feedback." Make it a labeled pill ("Finish ✓") and consider a gentle nudge after N turns.
- **Per-turn assessment cards fight the conversation.** Each user bubble can be followed by a full assessment card (score, meter, model sentence, summary, support lines, focus, tips — ConversationBubble.tsx:49-82). Visually the "conversation" becomes a report log; it also contradicts the Speak hub promise "corrections come mostly after the session." Recommendation: in free chat/roleplay show only a small verdict chip on the bubble (tap to expand); reserve full cards for drill mode.
- **No live transcription or waveform while recording.** The only recording feedback is the mic turning red and a timer in the Learn tab (the Speak mic doesn't even show elapsed time). A pulsing level indicator + elapsed time on the floating mic would reduce "is it hearing me?" anxiety — the defining emotion of this persona.
- **Processing states block the whole screen** (`isProcessing` disables back, end, and mic). A voice turn takes ~4–8 s (per project logs); show a typing/thinking indicator bubble from the coach instead of just a spinner in the mic button, so the wait reads as "coach is thinking," which the `CoachAvatar` state system already supports but the message list doesn't visualize.
- **Speak hub hierarchy is inverted:** "Live conversation" is the primary button while it's the least stable feature, and the most-used turn-based "Free chat" is the last secondary button (speak/index.tsx:20-39). "Popular practice" lists three scenarios as plain text lines — they look informational but aren't tappable; either make them scenario cards that launch roleplay or drop them.

## 6. Consistency & system-level notes

- **Two progress-bar implementations** (LessonProgressBar in [lessonId].tsx:961-981 vs. learn/index.tsx track/fill styles) and **two score-pill styles** — extract shared `ProgressTrack` and `ScorePill` components.
- **Verdict copy varies by surface:** "Clear. You can continue." (lesson) vs "Clear" (bubble) vs "Improved" (drill) — define one verdict vocabulary with one Hinglish translation each.
- **Success color duplication:** `success` (#2E8B57) and `secondary` (#168F7A) both mean "good" in different places; `accent` (#F3B33D) appears unused in the reviewed screens. Trim the palette to what's actually semantic.
- **Dark mode is absent** and the cream background is baked into ~40 style objects; if dark mode is ever planned, moving to semantic tokens now (background/surface/on-surface) is cheap, later is not.
- **Contrast check:** `muted` #6E625B on `background` #FFF9F2 ≈ 4.9:1 — passes AA for body text, but the 12–13 px 900-weight uppercase eyebrows in `primaryDark`/`primary` on warm surfaces should be spot-checked (small + all-caps is the risky combo).

## 7. Top five design changes by impact

1. Establish a real type scale and stop using weight-900 for everything (§2).
2. Rewrite all status/help/error copy to A1 English + Hinglish; remove implementation jargon from the UI (§3).
3. Replace per-turn score dumps with verdict chips (expandable), full cards only in drills (§5).
4. Replace raw percentages with verdict bands + coarse meters across Learn and Speak (§4).
5. Make "end session" a labeled, inviting action and add recording-in-progress feedback (§5).
