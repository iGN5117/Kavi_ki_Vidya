# English Speaking App - Product Requirements

Status: Frozen for prototype planning
Date: 2026-04-28
Owner: Product Management

## 1. Product Summary

The product is a mobile application for iOS and Android that helps Indian homemakers learn spoken English through short daily lessons, confidence-building practice, Hindi/Hinglish support, and always-available AI speaking conversations.

The first version is a prototype focused on English (India). It should assume the learner already knows the English alphabet but is an absolute beginner in spoken English. The product should be designed so future source languages and target language variants can be added without reworking the core learning structure.

## 2. Goals

- Help homemakers build confidence speaking basic English in everyday Indian contexts.
- Encourage daily learning through short 3-5 minute lessons, streaks, and achievable goals.
- Provide progressive modules that move from simple words and phrases to practical conversations.
- Let learners skip any lesson or module after seeing a clear overview of what they are skipping.
- Offer Hindi meaning support in both Devanagari and Hinglish.
- Provide a dedicated Speaking tab for both guided roleplay and open-ended conversation.
- Give supportive feedback on pronunciation, grammar, and confidence.
- Keep the prototype practical, focused, and extensible.

## 3. Non-Goals For Prototype

- Offline lesson access.
- Full production analytics, payments, subscriptions, or admin tooling.
- Support for source languages beyond Hindi/Hinglish.
- Advanced school-style reading/writing curriculum.
- Perfect pronunciation scoring across every Indian accent.
- Human tutor marketplace or live teacher scheduling.

## 4. Target Users

Primary user: Indian homemakers who want to speak English more confidently in daily life.

Assumptions:

- They know the English alphabet.
- They may understand some common English words but cannot speak confidently.
- They may prefer explanations in Hindi, Hinglish, or a mix.
- They may have limited uninterrupted time, so lessons must be short.
- They may feel nervous about speaking, so feedback must be encouraging rather than harsh.

## 5. Supported Languages And Locale

Prototype target language:

- English (India)

Prototype support language:

- Hindi in Devanagari
- Hinglish in Roman script

Language requirements:

- Any teaching sentence should offer a meaning/explanation toggle.
- The user should be able to choose Hindi or Hinglish explanations.
- Speaking practice should allow the user to speak in Hindi, English, or a mix.
- The app should translate naturally between Hindi/Hinglish and English where useful.
- Content data should separate target language, support language, translations, and lesson metadata to support future languages later.

## 6. Product Navigation

The prototype should use a simple mobile tab structure:

- Learn: daily path, modules, lessons, streak state.
- Speak: guided roleplay and open-ended conversation.
- Review: mistakes, saved phrases, pronunciation/grammar practice.
- Profile: goals, streak, local learner profile, language preferences, Supabase sync status.

For the prototype, Review and Profile can be lightweight if needed, but Learn and Speak are core.

## 7. Onboarding

Prototype onboarding should include:

- Local learner profile sign-in.
- Supabase-backed persistence for progress, streaks, review, and speaking feedback.
- Google and Apple OAuth are out of scope for now.
- User selects explanation preference: Hindi, Hinglish, or both.
- User selects daily goal: 5 minutes, 10 minutes, or 15 minutes.
- Optional confidence question: "How comfortable are you speaking English?"

No placement test is required for prototype because the starting level is absolute beginner. Users can skip known material freely.

## 8. Daily Learning And Streaks

The app should encourage a Duolingo-style daily habit.

Prototype requirements:

- Show current streak.
- Show today's learning goal progress.
- Show a clear "continue learning" action.
- Award streak progress when the user completes at least one lesson or a minimum speaking practice target.
- Keep streak mechanics simple for prototype.

Nice-to-have for prototype:

- Streak freeze/rest day concept.
- Reminder notification preference.

## 9. Learning Model

Lessons should be practical, short, and speaking-first.

Each lesson should:

- Take approximately 3-5 minutes.
- Start with a short overview of what the learner will practice.
- Teach through examples rather than heavy grammar lectures.
- Include Hindi/Hinglish meaning support.
- Include at least one speaking activity.
- End with a tiny success moment and a suggested next step.

Lesson activity types:

- Listen and repeat.
- Translate meaning from Hindi/Hinglish to English.
- Choose the best English sentence.
- Fill in a simple phrase.
- Speak a sentence aloud.
- Mini roleplay prompt.

## 10. Module Progression

The curriculum should progress from survival English to practical conversations.

Suggested prototype module path:

1. First English Sentences
   - Greetings, names, "I am...", "This is...", polite words.
2. Home And Family
   - Family members, daily routines, simple needs.
3. Daily Actions
   - Present tense basics, common verbs, asking simple questions.
4. Shopping And Directions
   - Buying items, prices, asking where something is.
5. Phone And Customer Support
   - Calling, explaining a problem, asking for help.
6. School And Parent Conversations
   - Talking to teachers, school updates, child-related conversations.
7. Travel And Local Transport
   - Auto, cab, metro, addresses, timings.
8. Social Small Talk
   - Neighbors, guests, introductions, polite conversation.
9. Work And Office Basics
   - Speaking to a manager, basic office calls, meetings.
10. Interview And Self-Introduction
   - Introducing oneself, strengths, simple answers.

The exact number of lessons per module can be small in the prototype. Depth can increase later.

## 11. Skipping Lessons And Modules

Users may skip any lesson or module entirely.

Skip flow:

1. User taps skip.
2. App shows a short overview of the lesson/module content.
3. App asks for confirmation.
4. If confirmed, the lesson/module is marked skipped.
5. Skipped content should remain available to revisit later.

The prototype should not block users with prerequisites.

## 12. Hindi And Hinglish Meaning Support

Every teaching sentence or concept should support meaning assistance.

Requirements:

- Show an option such as "Meaning" or a language toggle.
- Provide Hindi in Devanagari.
- Provide Hinglish in Roman script.
- Keep explanations simple and conversational.
- Avoid overly formal grammar-heavy explanations.

Example:

English: "I need help."
Hindi: "मुझे मदद चाहिए।"
Hinglish: "Mujhe madad chahiye."

## 13. Speaking Tab

The Speaking tab is a core differentiator and must be available anytime.

Modes:

- Guided Roleplay: structured practice with a scenario, learner goal, and AI partner.
- Free Chat: open-ended conversation where the learner can talk naturally.

Supported input:

- English speech.
- Hindi speech.
- Mixed Hindi/English speech.

Expected behavior:

- AI replies naturally and supportively.
- AI can translate or rephrase when the learner struggles.
- AI should help the learner say the same idea in better English.
- AI should not interrupt confidence with excessive correction.
- The user can ask "How do I say this in English?" in Hindi or Hinglish.

Initial roleplay scenarios:

- Introductions.
- Office calls.
- Interviews.
- Travel.
- Shopping.
- School/college conversations.
- Customer service.
- Small talk.
- Talking to a manager.
- Ordering food.
- Parent-teacher conversation.
- Local transport and directions.

## 14. Speaking Feedback

The prototype should provide simple feedback after speaking turns or at the end of a practice session.

Feedback categories:

- Pronunciation: whether the sentence was understandable and any key word to retry.
- Grammar: corrected sentence with a short Hindi/Hinglish explanation.
- Confidence: encouragement based on completion, pace, and willingness to speak.

Feedback style:

- Supportive and practical.
- Avoid shame-based language.
- Prefer "Better way to say it..." over "Wrong."
- Include repeat practice when useful.

## 15. Review Experience

The prototype should include a lightweight review experience if time permits.

Review content:

- Saved useful phrases.
- Common mistakes from speaking practice.
- Sentences the learner struggled with.
- Vocabulary from completed lessons.

Review activities:

- Repeat phrase.
- Choose correct sentence.
- Speak improved sentence.

## 16. Notifications

Prototype notification support is optional.

If included:

- Ask permission respectfully.
- Send daily reminder based on selected goal.
- Keep reminders encouraging and brief.

## 17. Extensibility Requirements

The product should be designed for future expansion to other source languages and possibly other English variants.

Content should avoid hardcoding:

- Hindi-only explanation fields.
- English (India)-only speech settings.
- Module structures tied to one language.

Suggested content model concepts:

- targetLanguage: `en-IN`
- supportLanguages: `hi-Deva`, `hi-Latn`
- lesson metadata
- sentence translations
- explanation variants
- scenario metadata
- difficulty level

## 18. Prototype Success Criteria

The prototype is successful if a user can:

- Continue with a local learner profile.
- Select Hindi/Hinglish explanation preferences.
- See a daily learning path with streak progress.
- Complete a 3-5 minute beginner lesson.
- View an overview before starting a lesson.
- Skip a lesson/module after seeing an overview.
- Tap any teaching sentence and see Hindi/Hinglish meaning.
- Open the Speaking tab anytime.
- Complete at least one guided roleplay scenario.
- Have a basic free chat using English, Hindi, or mixed speech.
- Receive supportive pronunciation, grammar, and confidence feedback.

## 19. MVP Scope Summary

Must have:

- iOS and Android prototype.
- Local learner profile with Supabase-backed persistence.
- Learn tab with modules and lessons.
- 3-5 minute lessons.
- Lesson overview before each lesson.
- Free skipping with overview confirmation.
- Hindi and Hinglish meaning support.
- Speaking tab with guided roleplay and free chat.
- Initial Indian-context scenarios.
- Basic streak and daily goal tracking.
- Pronunciation, grammar, and confidence feedback.
- Internet-only operation.

Should have:

- Review tab for mistakes and saved phrases.
- Daily reminders.
- Streak freeze/rest day.

Won't have in prototype:

- Offline mode.
- Payments.
- Full admin CMS.
- Source languages beyond Hindi/Hinglish.
- Production-grade analytics.

## 20. Open Questions For Later Phases

- Which app framework will be used for the prototype?
- Which AI speech and conversation stack will power speaking practice?
- Should the prototype use a real backend or local/mock content with a lightweight backend?
- How many lessons per module should be built for the first demo?
- What exact brand name, visual identity, and tone should the design use?
- What privacy policy and data handling language is needed for recorded speech?
