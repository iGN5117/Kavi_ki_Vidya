# Kavi ki Vidya - Technical Implementation Plan

Status: Frozen for prototype implementation
Date: 2026-04-28
Owner: Technical Implementation
Related requirements: `/docs/product/requirements.md`
Related design: `/docs/design/mobile-ux.md`

## 1. Technical Summary

Kavi ki Vidya will be implemented as a cross-platform iOS and Android prototype using Expo React Native, TypeScript, and Expo Router.

The prototype should prioritize the Speaking tab and prove the core product promise: an Indian homemaker who is an absolute beginner can practice spoken English in a calm, supportive mobile experience using Hindi, Hinglish, English, or a mix.

The first implementation will use:

- Expo React Native for one shared iOS/Android app.
- Expo Router for onboarding, protected app routes, tabs, and detail screens.
- OpenAI as the primary AI provider.
- OpenAI Realtime API with `gpt-realtime` for live speaking sessions.
- A tiny local/server endpoint to mint ephemeral OpenAI Realtime credentials.
- Local-only persistence for prototype progress, streaks, preferences, saved phrases, and session summaries.
- A small consistent Indian woman coach avatar set with neutral, listening, speaking, encouraging, and thinking states.

## 2. Frozen Technical Decisions

- Framework: Expo React Native + TypeScript + Expo Router.
- Auth: simulated login for the prototype.
- Apple sign-in: show only on iOS and keep optional until Apple Developer setup exists.
- Voice/AI: real voice pipeline from the beginning.
- AI provider: OpenAI.
- Voice model: OpenAI Realtime API using `gpt-realtime`.
- Feedback: structured end-session feedback generated from the speaking session.
- API key handling: permanent OpenAI keys must never be stored in the mobile app.
- Persistence: local-only prototype storage.
- Avatar: consistent Indian woman coach avatar set, not a single static image.

## 3. Current Repository State

The repository currently contains planning documentation only:

```text
docs/
  product/
    requirements.md
  design/
    mobile-ux.md
  technical/
    implementation-plan.md
```

There is no existing app scaffold, `package.json`, iOS project, Android project, backend, or test setup yet.

## 4. Proposed App Architecture

### 4.1 Runtime Architecture

```text
Mobile app (Expo React Native)
  |
  |-- Local app state and persisted prototype data
  |
  |-- Static curriculum/scenario content
  |
  |-- Simulated auth state
  |
  |-- Realtime voice client
        |
        |-- Calls local/server endpoint for ephemeral session credentials
        |
        |-- Connects to OpenAI Realtime API
        |
        |-- Sends microphone audio and receives assistant audio/events
```

### 4.2 Recommended Technical Layers

- `app/`: Expo Router routes, tab layout, onboarding stack, and screen-level composition.
- `src/features/`: product feature modules such as onboarding, learn, speak, review, and profile.
- `src/components/`: reusable UI components aligned with the design doc.
- `src/content/`: local curriculum, roleplay scenarios, lesson metadata, and translation data.
- `src/services/`: service adapters for auth, Realtime voice, feedback, storage, and generated content.
- `src/store/`: lightweight app state, probably Zustand with persisted slices.
- `src/theme/`: design tokens, color palette, spacing, typography, and component primitives.
- `server/`: minimal local/server endpoint for OpenAI Realtime ephemeral credential creation.
- `assets/avatars/`: generated coach avatar state images.

## 5. Proposed Folder Structure

```text
app/
  _layout.tsx
  index.tsx
  onboarding/
    sign-in.tsx
    language.tsx
    daily-goal.tsx
  (tabs)/
    _layout.tsx
    learn/
      index.tsx
      module/[moduleId].tsx
      lesson/[lessonId].tsx
    speak/
      index.tsx
      roleplay.tsx
      conversation.tsx
      feedback.tsx
    review/
      index.tsx
    profile/
      index.tsx

src/
  components/
    CoachAvatar.tsx
    ConversationBubble.tsx
    FeedbackSummary.tsx
    GoalProgress.tsx
    LessonCard.tsx
    MeaningPanel.tsx
    PrimaryActionButton.tsx
    ScenarioCard.tsx
    SkipConfirmationSheet.tsx
    StreakProgress.tsx
    VoiceControlBar.tsx
  content/
    lessons.ts
    modules.ts
    scenarios.ts
  features/
    learn/
    onboarding/
    profile/
    review/
    speak/
  services/
    auth/
      simulatedAuth.ts
    feedback/
      feedbackSchema.ts
    realtime/
      realtimeClient.ts
      sessionConfig.ts
    storage/
      localStorage.ts
  store/
    useAppStore.ts
  theme/
    colors.ts
    spacing.ts
    typography.ts
    theme.ts
  types/
    content.ts
    progress.ts
    speaking.ts

server/
  realtime-session.ts

assets/
  avatars/
    coach-neutral.png
    coach-listening.png
    coach-speaking.png
    coach-encouraging.png
    coach-thinking.png
```

The exact route file names can be adjusted during implementation if Expo Router conventions make a different grouping cleaner.

## 6. Navigation Plan

### 6.1 App Entry

- On first launch, route to onboarding.
- Simulated sign-in sets a local auth flag.
- After onboarding, route to the main tab shell.

### 6.2 Main Tabs

- Learn: daily path, modules, lesson overview, lesson activity, skip confirmation.
- Speak: coach avatar, roleplay, free chat, live conversation, end feedback.
- Review: saved phrases and mistakes, lightweight for prototype.
- Profile: simulated account state, daily goal, language preference, streak summary.

### 6.3 Protected App Behavior

Because auth is simulated, route protection can be simple:

- If `hasCompletedOnboarding` is false, show onboarding.
- If true, show `(tabs)`.
- Store the flag locally so the prototype feels persistent across restarts.

## 7. Content Model

Prototype content should be local TypeScript data, not a CMS.

Content must stay future-language-ready by separating target language, support languages, and explanations.

Example shape:

```ts
type LocalizedSupport = {
  "hi-Deva"?: string;
  "hi-Latn"?: string;
};

type TeachingSentence = {
  id: string;
  targetLanguage: "en-IN";
  targetText: string;
  support: LocalizedSupport;
  notes?: LocalizedSupport;
};
```

Initial content should include:

- 2-3 modules.
- 1 complete beginner lesson.
- 6-8 roleplay scenarios.
- Free chat mode.
- Sample saved phrases and mistakes for Review.

## 8. Speaking And Voice Pipeline

### 8.1 Target Experience

The Speaking tab should provide two modes:

- Guided Roleplay: scenario-based practice with goal, difficulty, suggested replies, and coach guidance.
- Free Chat: open conversation with Hindi, Hinglish, English, or mixed input.

The assistant should respond naturally, avoid excessive interruption, and produce most corrections at the end of the session.

### 8.2 Realtime Session Flow

```text
User opens conversation
  |
  |-- App requests microphone permission
  |
  |-- App asks local/server endpoint for ephemeral OpenAI Realtime credentials
  |
  |-- Endpoint uses permanent OpenAI API key server-side
  |
  |-- Endpoint returns ephemeral session credential to app
  |
  |-- App opens Realtime connection using ephemeral credential
  |
  |-- App streams microphone audio to OpenAI
  |
  |-- OpenAI returns assistant audio, transcript events, and conversation events
  |
  |-- App renders chat turns, avatar state, and voice controls
  |
  |-- User ends session
  |
  |-- App requests/generates structured feedback summary
  |
  |-- Feedback is saved locally
```

### 8.3 Session Configuration

Each Realtime session should include instructions for:

- Speaking as a warm Indian woman English coach for homemakers.
- Supporting Hindi, Hinglish, English, and mixed-language input.
- Helping the learner express her idea in simple English.
- Avoiding harsh correction during the conversation.
- Saving corrections mostly for the end.
- Keeping roleplay context if a scenario is selected.
- Providing simple, confidence-building language.
- Making clear that the assistant voice is AI-generated.

### 8.4 Conversation Modes

Roleplay sessions should pass scenario metadata:

- Scenario id.
- Scenario title.
- Learner goal.
- Difficulty: Easy, Guided, or Natural.
- Suggested beginner replies.
- Preferred support language setting.

Free chat sessions should pass:

- User preference: Hindi, Hinglish, or Both.
- Conversation goal: casual speaking confidence.
- Coach behavior: patient, natural, supportive.

### 8.5 Structured Feedback

At the end of a speaking session, generate a typed feedback object:

```ts
type SpeakingFeedback = {
  pronunciation: {
    summary: string;
    retryWords: string[];
  };
  grammar: {
    improvedSentences: Array<{
      original?: string;
      improved: string;
      explanation: {
        "hi-Deva"?: string;
        "hi-Latn"?: string;
      };
    }>;
  };
  confidence: {
    note: string;
    nextStep: string;
  };
  savedPhrases: string[];
  mistakes: string[];
};
```

For the prototype, pronunciation feedback should be framed as understandability and retry suggestions. Formal phoneme-level or word-level scoring can be added later with Azure Pronunciation Assessment or a similar dedicated speech assessment service.

### 8.6 Realtime Versus Fallback

The target path is OpenAI Realtime from the beginning. A minimal fallback should still exist for demo resilience:

- If Realtime connection fails, show a clear connection state.
- Allow typed sample input so the UI can still demonstrate the flow.
- Use local sample feedback if the session cannot complete.

This fallback is for prototype reliability only, not the primary experience.

## 9. API Key And Security Approach

Permanent OpenAI API keys must stay outside the mobile app.

### 9.1 Prototype Endpoint

Create a tiny local/server endpoint, for example:

```text
POST /api/realtime/session
```

Responsibilities:

- Read permanent OpenAI API key from server environment.
- Create an ephemeral Realtime session credential.
- Return only the ephemeral credential and session metadata to the app.
- Apply basic origin/dev checks where practical.

The endpoint can run as a small Node/Express server, an Expo Router API route if it fits the scaffold, or another lightweight local server. The implementation should favor the simplest reliable setup for local prototype testing.

### 9.2 Environment Variables

Expected local env:

```text
OPENAI_API_KEY=...
EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=http://localhost:<port>/api/realtime/session
```

Only `EXPO_PUBLIC_*` values are exposed to the app. The permanent OpenAI key must not use an `EXPO_PUBLIC_` prefix.

### 9.3 Prototype Privacy Notes

The UI should disclose that:

- The voice coach is AI-generated.
- Speech is sent to an AI service for conversation and feedback.
- The prototype stores progress locally on the device.

Production would need a fuller privacy policy, consent language, retention controls, and account deletion behavior.

## 10. Local Persistence

Use local-only persistence for the prototype. Recommended options:

- Zustand store with persistence middleware.
- AsyncStorage or MMKV for general local state.
- SecureStore only if any sensitive token-like values need to be stored.

Persist:

- Simulated auth state.
- Onboarding completion.
- Explanation preference: Hindi, Hinglish, Both.
- Daily goal.
- Streak count.
- Last active date.
- Completed lessons.
- Skipped lessons/modules.
- Saved phrases.
- Speaking session summaries.
- Common mistakes.

Do not persist:

- Permanent OpenAI API keys.
- Raw long-running audio recordings.
- Sensitive OAuth tokens, since auth is simulated.

## 11. Avatar Asset Strategy

The app should include a consistent Indian woman coach avatar set.

Recommended prototype approach:

1. Generate a cohesive raster avatar set in the same style.
2. Export PNG assets at mobile-friendly sizes.
3. Include these states:
   - Neutral
   - Listening
   - Speaking
   - Encouraging
   - Thinking
4. Use the avatar state based on conversation events:
   - Idle: neutral
   - Recording/listening: listening
   - Assistant audio playing: speaking
   - Feedback success: encouraging
   - Generating response: thinking

Accessibility requirement:

- Do not rely on avatar changes alone. Always pair state with visible mic controls, text labels, and status indicators.

Asset guidance:

- Adult Indian woman.
- Warm, calm, approachable.
- Supportive coach or elder-sister feeling.
- Modern Indian casual or simple professional clothing.
- Respectful, realistic, not childish, not overly glamorous.

## 12. UI Implementation Notes

The app should follow the design doc:

- Calm adult-friendly palette.
- Four-tab bottom navigation.
- Speaking tab prioritized.
- Large readable text and touch targets.
- Clear microphone recording state.
- No red-heavy correction language.
- Meaning support available on teaching and correction text.
- Skip confirmation before marking content skipped.

Recommended component build order:

1. Theme tokens and base screen layout.
2. Bottom tabs.
3. Coach avatar.
4. Speaking home.
5. Scenario picker.
6. Conversation screen and voice control bar.
7. Feedback summary.
8. Learn home and lesson overview.
9. Meaning panel.
10. Skip confirmation sheet.
11. Review and Profile placeholders.

## 13. Implementation Phases

### Phase 0 - Scaffold

- Create Expo TypeScript app.
- Add Expo Router.
- Add lint/typecheck scripts.
- Add app theme and route groups.
- Add placeholder tab screens.

### Phase 1 - Prototype State And Content

- Add local content models.
- Add sample modules, one full beginner lesson, and roleplay scenarios.
- Add local persistence store.
- Add simulated auth/onboarding state.

### Phase 2 - Speaking UI

- Build Speaking home.
- Build avatar state component.
- Build roleplay picker.
- Build conversation screen.
- Build mic/listening/speaking UI states.
- Build end-session feedback screen.

### Phase 3 - OpenAI Realtime Integration

- Add local/server endpoint for ephemeral Realtime credentials.
- Add mobile Realtime client service.
- Connect microphone permissions and audio streaming.
- Render assistant transcript/audio events.
- Add roleplay/free-chat session instructions.
- Add failure and reconnect states.

### Phase 4 - Feedback And Review

- Generate structured end-session feedback.
- Save feedback locally.
- Add saved phrases and common mistakes to Review.
- Add retry pronunciation UI placeholder.

### Phase 5 - Learn Flow

- Build Learn home.
- Build module list/detail.
- Build one complete beginner lesson.
- Add overview-before-lesson.
- Add Hindi/Hinglish meaning panel.
- Add skip confirmation and skipped state.
- Update streak and daily goal progress on completion.

### Phase 6 - Polish And Verification

- Verify iOS and Android layouts.
- Verify smaller Android screen readability.
- Verify Devanagari rendering.
- Verify no text overlap.
- Verify Realtime failure fallback.
- Verify local persistence across app reload.
- Verify no permanent API key is bundled into the app.

## 14. Testing And Verification

Prototype verification should include:

- Typecheck passes.
- App launches on iOS simulator or Expo Go.
- App launches on Android emulator or Expo Go.
- Onboarding completes and persists.
- Tabs navigate correctly.
- Speaking tab can start a roleplay session.
- Free chat can start a live Realtime session.
- End-session feedback renders structured categories.
- Learn flow shows lesson overview before activity.
- Skip flow shows overview before confirmation.
- Meaning support shows Hindi and Hinglish.
- Streak/progress state persists locally.

For automated testing, keep scope light:

- Unit tests for content helpers and feedback parsing if test setup is added.
- Manual device/simulator testing for audio permissions and Realtime behavior.

## 15. Known Risks

### Realtime Audio Complexity

Realtime audio in React Native can be more complex than web due to microphone capture, audio playback, permissions, and platform differences. This is the largest technical risk.

Mitigation:

- Implement the Realtime service behind a narrow adapter.
- Keep a typed fallback mode for demos.
- Test on real devices early.

### Ephemeral Credential Endpoint

The app needs a server-side component even for a prototype so permanent OpenAI keys are not exposed.

Mitigation:

- Keep the endpoint minimal.
- Document required environment variables.
- Keep secrets out of Expo public config.

### Cost And Latency

Live voice sessions can incur API cost and may vary by network quality.

Mitigation:

- Limit session length in prototype.
- Show connection and reconnect states.
- Keep roleplay sessions short.

### Pronunciation Feedback Accuracy

OpenAI conversation feedback can be supportive and useful, but formal pronunciation scoring may require a specialized assessment service.

Mitigation:

- Frame prototype pronunciation feedback as understandability and retry suggestions.
- Add Azure Pronunciation Assessment later if phoneme/word-level scoring becomes a product requirement.

### Apple Sign-In

Apple sign-in requires platform setup and Apple Developer capabilities for production readiness.

Mitigation:

- Show Apple option only on iOS.
- Mark it optional/unavailable in prototype if setup is missing.
- Keep simulated auth as the prototype path.

### Avatar Consistency

Generated assets may vary across states if prompts are not controlled.

Mitigation:

- Generate the avatar set together where possible.
- Use consistent prompt details, style, pose, clothing, lighting, and crop.
- Review assets before wiring them into UI.

## 16. Out Of Scope For First Prototype

- Production backend database.
- Real Google OAuth.
- Production Apple Sign-In.
- Payments or subscriptions.
- Admin CMS.
- Offline lesson mode.
- Full analytics.
- Push notifications.
- Formal privacy/account deletion flows.
- Advanced pronunciation scoring.
- Multiple source languages beyond Hindi/Hinglish.

## 17. External References

- OpenAI Realtime transcription and speech-to-speech overview: https://developers.openai.com/api/docs/guides/realtime-transcription
- OpenAI text-to-speech guide: https://developers.openai.com/api/docs/guides/text-to-speech
- OpenAI `gpt-realtime` release notes: https://openai.com/index/introducing-gpt-realtime/
- Expo authentication guide: https://docs.expo.dev/develop/authentication/
- Supabase React Native auth guide, useful for future real OAuth: https://supabase.com/docs/guides/auth/quickstarts/react-native

## 18. Acceptance Criteria For Implementation

The technical implementation is considered successful when:

- The app runs on iOS and Android through Expo.
- The app uses Expo Router with onboarding and four tabs.
- Simulated login and onboarding preferences persist locally.
- Speaking tab includes roleplay and free chat.
- A Realtime voice session can be started without storing permanent OpenAI keys in the mobile app.
- The coach avatar changes between defined visual states.
- End-session feedback includes pronunciation, grammar, and confidence sections.
- Learn tab includes one complete beginner lesson with overview, meaning support, and skip confirmation.
- Progress, streak, skipped items, saved phrases, and feedback summaries persist locally.
