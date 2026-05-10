---
type: community
cohesion: 0.07
members: 53
---

# app_layout_rootlayout

**Cohesion:** 0.07 - loosely connected
**Members:** 53 nodes

## Members
- [[CoachState]] - code - src/types/speaking.ts
- [[CoachTurnResult]] - code - src/services/realtime/realtimeClient.ts
- [[ConversationBubble.tsx]] - code - src/components/ConversationBubble.tsx
- [[ConversationMode]] - code - src/types/speaking.ts
- [[ConversationTurn]] - code - src/types/speaking.ts
- [[HealthResponse]] - code - src/services/realtime/realtimeClient.ts
- [[LearnLayout()]] - code - app/(tabs)/learn/_layout.tsx
- [[LessonAudioResult]] - code - src/services/realtime/realtimeClient.ts
- [[PracticeConnectionStatus]] - code - src/services/realtime/realtimeClient.ts
- [[PracticeDrill]] - code - app/(tabs)/speak/conversation.tsx
- [[PracticeSessionContext]] - code - src/services/realtime/realtimeClient.ts
- [[PronunciationCheckResult]] - code - src/types/speaking.ts
- [[RealtimeSessionInfo]] - code - src/services/realtime/realtimeClient.ts
- [[RootLayout()]] - code - app/_layout.tsx
- [[Scenario]] - code - src/types/content.ts
- [[SpeakLayout()]] - code - app/(tabs)/speak/_layout.tsx
- [[SpeakingFeedback]] - code - src/types/speaking.ts
- [[TabsLayout()]] - code - app/(tabs)/_layout.tsx
- [[VoiceTurnResult]] - code - app/(tabs)/speak/conversation.tsx
- [[_layout.tsx]] - code - app/_layout.tsx
- [[buildDrillResult()]] - code - app/(tabs)/speak/conversation.tsx
- [[buildLearnerMemory()]] - code - app/(tabs)/speak/conversation.tsx
- [[buildRealtimeInstructions()]] - code - src/services/realtime/sessionConfig.ts
- [[checkLessonPronunciation()]] - code - src/services/realtime/realtimeClient.ts
- [[checkPracticeConnection()]] - code - src/services/realtime/realtimeClient.ts
- [[conversation.tsx]] - code - app/(tabs)/speak/conversation.tsx
- [[createLessonAudio()]] - code - src/services/realtime/realtimeClient.ts
- [[createRealtimeSessionConfig()]] - code - server/dev-server.js
- [[generateSessionFeedback()]] - code - src/services/realtime/realtimeClient.ts
- [[getAudioUploadInfo()]] - code - src/services/realtime/realtimeClient.ts
- [[getConfiguredEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getErrorMessage()]] - code - src/services/sync/progressSync.ts
- [[getHealthEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getInitialPracticeConnectionStatus()]] - code - src/services/realtime/realtimeClient.ts
- [[getModelSentence()]] - code - src/components/ConversationBubble.tsx
- [[getPracticeDrill()]] - code - app/(tabs)/speak/conversation.tsx
- [[getRealtimeCallEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getRoleplayProgress()]] - code - app/(tabs)/speak/conversation.tsx
- [[getStarterTurn()]] - code - app/(tabs)/speak/conversation.tsx
- [[getTabBarStyle()]] - code - src/navigation/tabBarStyle.ts
- [[getVerdictLabel()]] - code - src/components/ConversationBubble.tsx
- [[hasPracticeEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[normalizeParam()]] - code - app/(tabs)/speak/conversation.tsx
- [[normalizePracticeText()]] - code - app/(tabs)/speak/conversation.tsx
- [[normalizeSpeechText()]] - code - server/dev-server.js
- [[realtimeClient.ts]] - code - src/services/realtime/realtimeClient.ts
- [[roleplayContext]] - code - app/(tabs)/speak/conversation.tsx
- [[sendTextTurn()]] - code - src/services/realtime/realtimeClient.ts
- [[sendVoiceTurn()]] - code - src/services/realtime/realtimeClient.ts
- [[sessionConfig.ts]] - code - src/services/realtime/sessionConfig.ts
- [[speaking.ts]] - code - src/types/speaking.ts
- [[tabBarStyle.ts]] - code - src/navigation/tabBarStyle.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/app_layout_rootlayout
SORT file.name ASC
```

## Connections to other communities
- 24 edges to [[_COMMUNITY_app_index_styles]]
- 12 edges to [[_COMMUNITY_adaptive_practiceplan_getlearnerpracticeplan]]
- 12 edges to [[_COMMUNITY_auth_sessionclient_createdevsession]]
- 9 edges to [[_COMMUNITY_app_tabs_speak_live_tsx]]
- 2 edges to [[_COMMUNITY_server_dev_server_createaudiopronunciationassessment]]
- 2 edges to [[_COMMUNITY_server_dev_server_access]]
- 2 edges to [[_COMMUNITY_server_dev_server_clampnumber]]
- 2 edges to [[_COMMUNITY_adaptive_practiceplan_adaptivelessonrecommendation]]
- 1 edge to [[_COMMUNITY_adaptive_practiceplan_getadaptivelessonrecommendation]]
- 1 edge to [[_COMMUNITY_server_dev_server_asstringarray]]
- 1 edge to [[_COMMUNITY_server_dev_server_clamprawtext]]

## Top bridge nodes
- [[conversation.tsx]] - degree 44, connects to 4 communities
- [[speaking.ts]] - degree 18, connects to 4 communities
- [[SpeakingFeedback]] - degree 9, connects to 4 communities
- [[normalizeSpeechText()]] - degree 7, connects to 4 communities
- [[createRealtimeSessionConfig()]] - degree 7, connects to 3 communities