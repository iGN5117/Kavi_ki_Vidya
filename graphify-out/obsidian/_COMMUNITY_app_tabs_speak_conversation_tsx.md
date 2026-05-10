---
type: community
cohesion: 0.06
members: 68
---

# app_tabs_speak_conversation_tsx

**Cohesion:** 0.06 - loosely connected
**Members:** 68 nodes

## Members
- [[AudioChunkEvent]] - code - src/services/audio/livePcmAudio.native.ts
- [[CoachTurnResult]] - code - src/services/realtime/realtimeClient.ts
- [[ConversationMode]] - code - src/types/speaking.ts
- [[ConversationScreen()]] - code - app/(tabs)/speak/conversation.tsx
- [[DrillResultOutcome]] - code - src/services/sync/progressSync.ts
- [[ErrorEvent]] - code - src/services/audio/livePcmAudio.native.ts
- [[HealthResponse]] - code - src/services/realtime/realtimeClient.ts
- [[KaviLiveAudioNativeModule]] - code - src/services/audio/livePcmAudio.native.ts
- [[LessonAudioResult]] - code - src/services/realtime/realtimeClient.ts
- [[LiveConversationScreen()]] - code - app/(tabs)/speak/live.tsx
- [[LiveLog]] - code - app/(tabs)/speak/live.tsx
- [[LiveRealtimeEvent]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveState]] - code - app/(tabs)/speak/live.tsx
- [[LiveWebRtcConnection]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveWebRtcOptions]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveWebSocketOptions]] - code - src/services/realtime/liveWebSocket.ts
- [[PracticeConnectionStatus]] - code - src/services/realtime/realtimeClient.ts
- [[PracticeDrill]] - code - app/(tabs)/speak/conversation.tsx
- [[PracticeSessionContext]] - code - src/services/realtime/realtimeClient.ts
- [[RealtimeSessionInfo]] - code - src/services/realtime/realtimeClient.ts
- [[StateEvent]] - code - src/services/audio/livePcmAudio.native.ts
- [[VoiceTurnResult]] - code - app/(tabs)/speak/conversation.tsx
- [[addLivePcmAudioChunkListener()]] - code - src/services/audio/livePcmAudio.ts
- [[addLivePcmAudioErrorListener()]] - code - src/services/audio/livePcmAudio.ts
- [[addLivePcmAudioStateListener()]] - code - src/services/audio/livePcmAudio.ts
- [[buildDrillResult()]] - code - app/(tabs)/speak/conversation.tsx
- [[buildLearnerMemory()]] - code - app/(tabs)/speak/conversation.tsx
- [[buildRealtimeInstructions()]] - code - src/services/realtime/sessionConfig.ts
- [[checkLessonPronunciation()]] - code - src/services/realtime/realtimeClient.ts
- [[checkPracticeConnection()]] - code - src/services/realtime/realtimeClient.ts
- [[clearLivePcmAudioPlayback()]] - code - src/services/audio/livePcmAudio.ts
- [[connectLiveWebRtc()]] - code - src/services/realtime/liveWebRtc.ts
- [[conversation.tsx]] - code - app/(tabs)/speak/conversation.tsx
- [[createLessonAudio()]] - code - src/services/realtime/realtimeClient.ts
- [[createRealtimeSessionConfig()]] - code - server/dev-server.js
- [[createRealtimeWebRtcAnswer()]] - code - src/services/realtime/realtimeClient.ts
- [[generateSessionFeedback()]] - code - src/services/realtime/realtimeClient.ts
- [[getAudioUploadInfo()]] - code - src/services/realtime/realtimeClient.ts
- [[getConfiguredEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getErrorMessage()]] - code - src/services/sync/progressSync.ts
- [[getHealthEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getInitialPracticeConnectionStatus()]] - code - src/services/realtime/realtimeClient.ts
- [[getPracticeDrill()]] - code - app/(tabs)/speak/conversation.tsx
- [[getRealtimeCallEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getRealtimeWebSocketEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getRoleplayProgress()]] - code - app/(tabs)/speak/conversation.tsx
- [[getStarterTurn()]] - code - app/(tabs)/speak/conversation.tsx
- [[hasPracticeEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[isLivePcmAudioAvailable()]] - code - src/services/audio/livePcmAudio.ts
- [[live.tsx]] - code - app/(tabs)/speak/live.tsx
- [[livePcmAudio.ts]] - code - src/services/audio/livePcmAudio.ts
- [[liveWebRtc.native.ts]] - code - src/services/realtime/liveWebRtc.native.ts
- [[liveWebRtc.ts]] - code - src/services/realtime/liveWebRtc.ts
- [[liveWebRtc.web.ts]] - code - src/services/realtime/liveWebRtc.web.ts
- [[liveWebSocket.ts]] - code - src/services/realtime/liveWebSocket.ts
- [[nativeModule]] - code - src/services/audio/livePcmAudio.native.ts
- [[normalizeParam()]] - code - app/(tabs)/speak/conversation.tsx
- [[normalizePracticeText()]] - code - app/(tabs)/speak/conversation.tsx
- [[playLivePcmAudioChunk()]] - code - src/services/audio/livePcmAudio.ts
- [[realtimeClient.ts]] - code - src/services/realtime/realtimeClient.ts
- [[roleplayContext]] - code - app/(tabs)/speak/conversation.tsx
- [[sendTextTurn()]] - code - src/services/realtime/realtimeClient.ts
- [[sendVoiceTurn()]] - code - src/services/realtime/realtimeClient.ts
- [[sessionConfig.ts]] - code - src/services/realtime/sessionConfig.ts
- [[startLivePcmAudioCapture()]] - code - src/services/audio/livePcmAudio.ts
- [[stopLivePcmAudio()]] - code - src/services/audio/livePcmAudio.ts
- [[stopLivePcmAudioCapture()]] - code - src/services/audio/livePcmAudio.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/app_tabs_speak_conversation_tsx
SORT file.name ASC
```

## Connections to other communities
- 28 edges to [[_COMMUNITY_app_index_styles]]
- 9 edges to [[_COMMUNITY_app_index_index]]
- 3 edges to [[_COMMUNITY_feedback_samplefeedback_applycommongrammarfixes]]
- 2 edges to [[_COMMUNITY_app_layout_rootlayout]]
- 2 edges to [[_COMMUNITY_server_dev_server_createaudiopronunciationassessment]]
- 1 edge to [[_COMMUNITY_server_dev_server_access]]
- 1 edge to [[_COMMUNITY_server_dev_server_clamprawtext]]

## Top bridge nodes
- [[conversation.tsx]] - degree 42, connects to 5 communities
- [[createRealtimeSessionConfig()]] - degree 7, connects to 3 communities
- [[realtimeClient.ts]] - degree 33, connects to 1 community
- [[live.tsx]] - degree 24, connects to 1 community
- [[getErrorMessage()]] - degree 11, connects to 1 community