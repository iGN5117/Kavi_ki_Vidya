# Kavi ki Vidya - Mobile UX Design

Status: Frozen for prototype implementation
Date: 2026-04-28
Owner: Product Design
Related requirements: `/docs/product/requirements.md`

## 1. Design Summary

Kavi ki Vidya is a cross-platform iOS and Android prototype that helps Indian homemakers build spoken English confidence through short daily lessons and an always-available speaking coach.

The design should feel calm, adult-friendly, encouraging, and practical. It can borrow the daily habit and streak mechanics of Duolingo, but it should not feel childish or overly game-like. The primary emotional promise is:

> "I can speak a little English today without feeling judged."

The prototype should prioritize the Speaking tab if implementation time is limited.

## 2. Target User Context

Primary users are Indian homemakers who:

- Know the English alphabet.
- Are absolute beginners in spoken English.
- May prefer Hindi, Hinglish, or both for explanations.
- Have limited uninterrupted time.
- May feel nervous speaking English aloud.
- Need practical English for family, travel, shopping, school, service, social, and work-adjacent situations.

## 3. UX Principles

### Calm Confidence

The app should reduce anxiety. Use supportive language, soft feedback, and clear next steps. Avoid harsh correction, red-heavy error states, or school-exam framing.

### Speak Early, Speak Often

Every lesson should lead to speaking quickly. Even simple lessons should include listen-and-repeat or a short spoken response.

### Small Daily Wins

Daily learning should feel achievable in 3-5 minutes. The home screen should emphasize one clear daily action, streak progress, and a small success moment.

### Hindi/Hinglish Without Friction

Meaning help should be available wherever the user sees a teaching sentence or correction. Switching between Hindi and Hinglish should be instant and predictable.

### User Control

Users can skip lessons and modules freely. The app should show what they are skipping, reassure them that they can return later, and avoid guilt-based messaging.

### Speaking Tab First

The Speaking tab is the core differentiator. It must be available from the bottom navigation at all times and should support both guided roleplay and free chat.

### Future Language Readiness

UI labels, lesson metadata, explanation choices, and speech configuration should not assume Hindi forever. The design should allow future support languages and English variants.

## 4. Navigation Model

Use a four-tab bottom navigation structure:

1. **Learn**
   - Daily lesson path
   - Modules
   - Lesson progress
   - Streak and goal progress

2. **Speak**
   - Guided roleplay
   - Free chat
   - Speaking coach avatar
   - Session feedback

3. **Review**
   - Saved phrases
   - Common mistakes
   - Pronunciation retry
   - Grammar practice

4. **Profile**
   - Google sign-in
   - Apple sign-in if practical
   - Daily goal
   - Hindi/Hinglish preference
   - Streak summary

For prototype scope, Learn and Speak are required. Review and Profile can be lightweight but should exist enough to communicate the product structure.

## 5. Screen Inventory

### Onboarding

- Welcome/sign-in screen
- Google OAuth sign-in
- Apple OAuth option if practical in the selected framework
- Explanation preference screen: Hindi, Hinglish, Both
- Daily goal screen: 5 minutes, 10 minutes, 15 minutes
- Optional confidence question: "How comfortable are you speaking English?"

### Learn

- Learn home
- Module list
- Module detail
- Lesson overview
- Lesson activity screens
- Meaning bottom sheet or inline meaning panel
- Skip confirmation sheet
- Lesson completion/success screen

### Speak

- Speaking home
- Roleplay scenario picker
- Roleplay setup screen
- Free chat start screen
- Live conversation screen
- Translation/rephrase assistance sheet
- End-of-session feedback screen

### Review

- Review home
- Saved phrases
- My mistakes
- Retry pronunciation
- Practice corrected sentence

### Profile

- Profile home
- Language preference settings
- Daily goal settings
- Login/account state
- Notification preference if included

## 6. Key Flows

### 6.1 Onboarding Flow

1. User opens Kavi ki Vidya.
2. User signs in with Google.
3. If available, user may choose Apple sign-in.
4. User selects explanation preference:
   - Hindi
   - Hinglish
   - Both
5. User selects a daily goal:
   - 5 minutes
   - 10 minutes
   - 15 minutes
6. User optionally answers confidence level.
7. App lands on Learn home with a clear first lesson action.

Design notes:

- Do not over-explain the product during onboarding.
- Use friendly, concise copy.
- The primary action should always be obvious.

### 6.2 Daily Learn Flow

1. User opens Learn tab.
2. User sees current streak, today's progress, and one primary lesson.
3. User taps "Start".
4. Lesson overview explains what will be practiced.
5. User completes short activities:
   - Example sentence
   - Meaning toggle
   - Listen and repeat
   - Choose or fill phrase
   - Speak aloud
6. User receives success state and suggested next step.

Design notes:

- Lesson overview must appear before the first activity.
- Keep lessons visually lightweight.
- Avoid dense grammar explanations.
- Use large tap targets and readable text.

### 6.3 Meaning Support Flow

1. User sees an English sentence or correction.
2. User taps "Meaning" or a language pill.
3. App shows:
   - Hindi in Devanagari
   - Hinglish in Roman script
4. User can close or keep the meaning visible while practicing.

Recommended UI:

- Use a compact `Meaning` button on sentence cards.
- If preference is "Both", show Hindi first and Hinglish below.
- If preference is Hindi or Hinglish, show the preferred language first with an option to switch.

### 6.4 Skip Lesson Or Module Flow

1. User taps "Skip".
2. App opens a confirmation sheet.
3. Sheet shows:
   - Lesson/module title
   - Short overview of what will be skipped
   - Reassurance: "You can come back anytime."
4. User confirms skip or cancels.
5. Skipped item remains visible with a "Skipped" state and a revisit action.

Tone:

- Neutral and respectful.
- No shame language.
- No locked prerequisite messaging.

### 6.5 Guided Roleplay Flow

1. User opens Speak tab.
2. User selects "Roleplay".
3. User picks a scenario:
   - Introductions
   - Shopping
   - Ordering food
   - Travel
   - Local transport/directions
   - Parent-teacher conversation
   - Customer service
   - Small talk
   - Office call
   - Talking to manager
   - Interview
4. User sees scenario goal and difficulty.
5. Conversation starts with the speaking coach.
6. User can speak in Hindi, English, or mixed language.
7. Coach responds naturally and helps when the user struggles.
8. Feedback is mostly shown at the end of the session.

Design notes:

- Add difficulty chips: Easy, Guided, Natural.
- Beginner roleplays should offer suggested replies.
- The conversation UI should make recording state unmistakable.

### 6.6 Free Chat Flow

1. User opens Speak tab.
2. User selects "Free Chat".
3. Coach greets the user and invites them to speak.
4. User speaks in Hindi, English, or mixed language.
5. Coach replies naturally and may rephrase ideas in better English.
6. User can tap "How do I say this?" at any time.
7. Feedback summary appears when the user ends the session.

Design notes:

- Free chat should feel less like a test and more like a patient conversation.
- Keep controls simple: mic, pause/end, help/rephrase.
- Avoid interrupting the user with constant correction.

### 6.7 Speaking Feedback Flow

Feedback should mostly appear at the end of a speaking session.

End-of-session feedback should include:

- **Pronunciation**: understandable words and one word to retry.
- **Grammar**: one or two improved sentences with Hindi/Hinglish explanation.
- **Confidence**: encouraging note based on completion and speaking attempt.

Recommended copy style:

- "Good effort. You completed the conversation."
- "Better way to say it..."
- "Try this word once more..."
- "Your meaning was clear."

Avoid:

- "Wrong"
- "Bad pronunciation"
- "You failed"
- Large red error states

## 7. Visual Style

### Overall Feel

The interface should be warm, clear, and adult-friendly. It should feel designed for everyday Indian household life, not a school textbook or children's game.

### Color Direction

Use a balanced palette with:

- Warm primary color for motivation and progress.
- Fresh secondary color for success and speaking activity.
- Neutral background colors for calm readability.
- High-contrast text for accessibility.

Avoid:

- One-note purple/blue gradients.
- Overly childish candy colors.
- Heavy dark themes for the prototype.
- Red-heavy correction UI.

### Typography

- Use large, readable type.
- Avoid tiny instructional text.
- Use clear hierarchy for English, Hindi, and Hinglish.
- Ensure Devanagari text renders cleanly on both iOS and Android.

### Components

- Bottom tabs with familiar icons and labels.
- Lesson cards with compact progress indicators.
- Sentence cards with clear audio, mic, and meaning controls.
- Scenario list items with icons and short labels.
- Bottom sheets for skip confirmation and meaning support.
- Simple streak and goal progress visuals.

### Imagery

Use visuals showing Indian homemakers and family contexts:

- Home setting
- Parent-teacher moment
- Shopping/market
- Local transport
- Phone conversation
- Family and neighbor conversation

Images and illustrations should feel respectful, modern, and realistic. Avoid stereotypes, exaggerated expressions, or infantilizing visuals.

## 8. Primary Speaking Coach Avatar

The app should include an Indian woman as the primary speaking coach/avatar.

Avatar guidance:

- Adult Indian woman, warm and approachable.
- Calm facial expression and confident posture.
- Should feel like a supportive coach or elder sister, not a strict teacher.
- Clothing can be modern Indian casual or simple professional attire.
- Avoid overly glamorous, cartoonish, or childish styling.
- Avatar should appear on:
  - Speaking home
  - Roleplay setup
  - Conversation header or idle state
  - Encouraging feedback screens

Prototype implementation options:

- Static illustrated avatar for fastest implementation.
- Lightly animated states if practical:
  - Listening
  - Speaking
  - Encouraging
  - Thinking

Accessibility note:

- Do not rely on avatar animation alone to communicate listening or recording state. Always pair with text, icons, and visible mic states.

## 9. Speaking-Priority Prototype Scope

If implementation time is limited, prioritize in this order:

1. Speaking tab structure with Roleplay and Free Chat entry points.
2. Conversation screen with clear voice controls.
3. End-of-session feedback for pronunciation, grammar, and confidence.
4. Roleplay scenario picker with Indian-context scenarios.
5. Learn home and one complete beginner lesson.
6. Meaning support for teaching and correction text.
7. Basic streak and daily goal state.
8. Lightweight Review and Profile screens.

The prototype should demonstrate the product's core promise: a beginner can speak in Hindi, English, or mixed language and receive supportive help to express herself in better English.

## 10. Accessibility And Inclusivity

Design requirements:

- Minimum touch targets should be comfortable on mobile.
- Text should remain readable on smaller Android devices.
- Avoid text overlap in lesson cards, buttons, and chat bubbles.
- All voice controls need visible labels or accessible names.
- Recording/listening state must be visually obvious.
- Provide non-audio text alternatives for important instructions and feedback.
- Do not use color alone to indicate progress, errors, or recording.
- Keep feedback emotionally safe and non-shaming.
- Support Devanagari and Roman script without truncation.

Content inclusivity:

- Use everyday Indian contexts without stereotyping homemakers.
- Avoid assuming employment status, income level, family structure, or education level.
- Use examples that are practical and respectful.

## 11. Implementation Handoff Notes

### Suggested Information Architecture

Use route groups or screens matching:

- `Onboarding`
- `Tabs/Learn`
- `Tabs/Speak`
- `Tabs/Review`
- `Tabs/Profile`
- `Lesson`
- `Conversation`
- `Feedback`

### State Needed For Prototype

User profile:

- Name
- Auth provider
- Explanation preference: Hindi, Hinglish, Both
- Daily goal
- Streak count
- Completed lessons
- Skipped lessons/modules

Lesson state:

- Module id
- Lesson id
- Overview
- Activity list
- Completion state
- Skip state

Speaking state:

- Mode: Roleplay or Free Chat
- Scenario id if roleplay
- Conversation turns
- Input language detected or selected
- Feedback summary
- Saved phrases
- Mistakes

### Content Model Hints

Avoid hardcoding Hindi-specific field names in components. Prefer structures that can later support more languages:

```json
{
  "targetLanguage": "en-IN",
  "supportLanguages": ["hi-Deva", "hi-Latn"],
  "sentence": {
    "target": "I need help.",
    "support": {
      "hi-Deva": "मुझे मदद चाहिए।",
      "hi-Latn": "Mujhe madad chahiye."
    }
  }
}
```

### Component Handoff

Core reusable components:

- `PrimaryActionButton`
- `BottomTabBar`
- `StreakProgress`
- `GoalProgress`
- `LessonCard`
- `LessonOverview`
- `SentencePracticeCard`
- `MeaningPanel`
- `SkipConfirmationSheet`
- `ScenarioCard`
- `CoachAvatar`
- `VoiceControlBar`
- `ConversationBubble`
- `FeedbackSummary`
- `SavedPhraseCard`

### Prototype Data

Use a small local/mock content set for the first build:

- 3-5 onboarding choices.
- 2-3 modules.
- 1 complete beginner lesson.
- 6-8 roleplay scenarios.
- 1 free chat entry point.
- Sample end-of-session feedback.

### Open Technical Questions For Implementation Phase

- Which cross-platform framework will be used?
- Will voice conversation be real-time or turn-based in the prototype?
- Which speech-to-text, text-to-speech, and AI conversation stack will be used?
- Will OAuth be fully wired or mocked for prototype review?
- Will avatar be generated artwork, stock illustration, or custom app asset?

## 12. Frozen Design Decisions

- Brand name: Kavi ki Vidya.
- App tone: calm, adult-friendly, supportive.
- Primary audience: Indian homemakers.
- Visual context: Indian homemakers and family life.
- Primary coach/avatar: Indian woman.
- Priority if time is limited: Speaking tab.
- Speaking modes: Guided Roleplay and Free Chat.
- Voice feedback timing: mostly end-of-session.
- Hindi support: Devanagari and Hinglish.
- Skipping: freely allowed after overview confirmation.
