<claude-mem-context>
# Memory Context

# [English_Learning_App_Codex] recent context, 2026-07-17 10:57pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (26,424t read) | 1,114,273t work | 98% savings

### Jul 5, 2026
S161 Speak tab per-sentence scoring redesign — user wants pronunciation, grammar, and intelligibility scoring with balanced difficulty (Jul 5 at 2:56 PM)
S159 Multi-perspective code review of "Kavi ki Vidya" English learning app — PM, CTO, and Design Expert reviews focused on Learn and Speak tab scoring effectiveness (Jul 5 at 2:56 PM)
S160 Speak tab scoring redesign — user wants per-sentence scoring of pronunciation, grammar, and intelligibility with balanced difficulty (Jul 5 at 2:59 PM)
S162 Speak tab per-sentence scoring design — full architecture proposal for pronunciation, grammar, and intelligibility with balanced calibration (Jul 5 at 3:05 PM)
875 6:34p 🔵 Feedback Evaluation Complete: All Three Reviews Verified Accurate Against Codebase
876 7:54p ⚖️ Implementation Plan Created to Fix Scoring Bugs from Feedback Review
877 " 🔵 Type System Map: Core Scoring Types All Live in progressSync.ts
878 " 🔵 Score Normalization Bug Confirmed in FeedbackSummary.tsx — 5th Site Found
879 7:56p 🔴 Step 2 Started: shared/scoringPolicy.js Created as Shared Scoring Contract
880 " 🔴 Type System Extended: PronunciationCheckResult.score Made Optional; LessonActivityAttemptResult Added
881 7:57p 🔴 Server Now Uses Shared Thresholds: localPronunciationCheck and needsPronunciationRetry Wired to scoringPolicy
882 " 🔴 Patch Application Failed: personalizeFeedbackWithTurnPronunciation Block Already Modified
883 " 🔴 Second Patch Failure: formatPronunciationContext Return Block Does Not Match Expected Lines
884 " 🔵 parseTurnPronunciation at Line 806: Returns undefined When score is Missing — Blocks Unscored Turn Data
885 " 🔵 Circular Free-Chat Scoring Confirmed at Line 2620: expectedText Falls Back to transcript
886 7:58p 🔴 Step 4 Complete on Server: Free-Chat Circular Scoring and Demo Contamination Fixed
887 " 🔵 localFeedback Function Already Updated: isPronunciationClear Wired, Score Emission Uses typeof Guard
888 " 🔴 Client-Side Score Normalization Fixed: sampleFeedback.ts and sessionReceipt.ts Updated
889 7:59p 🔴 Score Normalization Bug Fixed in All 5 Client Display Sites: FeedbackSummary.tsx and ConversationBubble.tsx Updated
890 " 🔴 Step 5 In Progress: createRealtimeSession Import Removed and withTimeout Helper Deleted from conversation.tsx
891 " 🔴 Steps 4+5 Complete on Client: Throwaway Realtime Call Removed, buildDrillResult Fixed, Free-Chat Scoring Gated
892 " 🔴 practicePlan.ts and useAppStore.ts Updated: Drill Focus Logic Fixed, Review Schedule Simplified, activityResults Wired
893 8:00p 🔴 getReviewSchedule Function Deleted from useAppStore.ts
894 " 🔴 Step 3 Complete: Learn Tab Scoring Rewritten to First-Attempt Per-Activity Model
895 " 🔴 Patch Target Mismatch: Component is Named PronunciationPractice Not PronunciationPracticeBlock
896 8:01p 🔴 render.yaml Threshold Values Aligned with Shared Policy; PronunciationPractice Score Display Fixed
897 " 🔵 Threshold Sweep: 2 Remaining Hardcoded Scoring Values Found; render.yaml has 2 Unexpanded 86s
### Jul 17, 2026
995 10:20p 🔵 ChatGPT Live Integration Inquiry — OpenAI Docs MCP Tools Confirmed Available
996 " 🔵 English Learning App Already Has Realtime Voice Infrastructure — ChatGPT Live Maps to OpenAI Realtime API
998 " 🔵 Complete Frontend Realtime Service Layer Mapped — WebRTC Disabled on iOS Simulator, Model String May Need Upgrade
997 10:21p 🔵 Full OpenAI Realtime API Integration Already Exists in English Learning App (Both WebRTC and WebSocket)
1002 10:22p 🔵 app/(tabs)/speak/live.tsx — Complete Live Conversation Screen with Dual Transport Strategy Already Implemented
1003 " 🔵 In-Progress Working Tree — Curriculum Content Feature Being Added Independently of Live Voice
1004 10:26p 🔵 OpenAI Realtime API Spec Confirms: Official Curl Example Uses "gpt-realtime" Alias; Semantic VAD is New; Session Config Nested Under session.audio.input
1005 10:27p ✅ Live Voice Upgrades Applied and Verified: semantic_vad, gpt-realtime-2.1, marin voice, client_secrets API, hands-free UX
1007 10:29p 🟣 Live Conversation Upgraded to OpenAI Realtime API v2 with Semantic VAD
1008 " 🔴 Native WebRTC Microphone Muting Was a No-Op — Now Correctly Toggles Track
1010 10:36p 🔵 Android Audio Format Investigation Requested — Speak Tab Had Prior Android-Specific Changes
1011 " 🔵 Android Audio Pipeline Mapped: M4A/AAC Recording → ffmpeg Conversion → WAV Assessment → Server-Side MIME Detection
1013 10:37p 🔵 Android Audio Pipeline Deep Audit Complete: All Key Functions Confirmed Intact
1015 " 🟣 Live Mode Persona Updated for Indian English Learner Context
1012 10:38p 🔵 Android Audio Pipeline: MPEG-4/AAC Recording with Server-Side WAV Conversion
1014 10:39p 🔵 Android Audio Smoke Test PASSED: M4A/AAC → ffmpeg WAV → Pronunciation Assessment Returns score with scoringMode "audio"
1016 10:40p 🔵 Android AAC/M4A Audio Successfully Scored by Pronunciation API
1017 " 🔵 Android Verification Script Requires Running Emulator — Cannot Run in CI Without Device
1018 " 🔵 Existing buildRealtimeInstructions Persona: Indian Homemaker English Coach
1019 " 🟣 New buildLiveRealtimeInstructions() and withLiveConversationInstructions() for Natural Live Mode
1020 10:43p 🟣 Production Readiness Check Now Gates on Indian English Accent Policy
1021 " ✅ Base buildRealtimeInstructions Softened to Remove Rigid Per-Turn Formula
1023 " 🔵 Live Realtime Persona Smoke Test Confirms Gentle Grammar Recast Behavior
1022 10:44p ⚖️ Live Mode Coach Persona: Indian English-Aware with Gentle Grammar Recasting
1024 " ✅ Knowledge Graph Updated After Live Mode Persona Changes
1025 10:45p 🔵 withTeachingStructureInstructions Retained for Non-Live Paths; Only Realtime Session Paths Use New Live Rules
1026 " ✅ Live Mode Voice Feedback: Indian Voice, Slower Speed, Speaker Routing Fix Requested

Access 1114k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
