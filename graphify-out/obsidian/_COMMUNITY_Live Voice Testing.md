---
type: community
cohesion: 0.07
members: 57
---

# Live Voice Testing

**Cohesion:** 0.07 - loosely connected
**Members:** 57 nodes

## Members
- [[Android emulator API host mapping]] - rationale - docs/technical/native-testing.md
- [[CoachTurnResult]] - code - src/services/realtime/realtimeClient.ts
- [[HealthResponse]] - code - src/services/realtime/realtimeClient.ts
- [[LessonAudioResult]] - code - src/services/realtime/realtimeClient.ts
- [[LiveConversationScreen()]] - code - app/(tabs)/speak/live.tsx
- [[LiveLog]] - code - app/(tabs)/speak/live.tsx
- [[LiveRealtimeEvent]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveState]] - code - app/(tabs)/speak/live.tsx
- [[LiveWebRtcConnection]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveWebRtcOptions]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveWebSocketOptions]] - code - src/services/realtime/liveWebSocket.ts
- [[Native Testing Checklist]] - document - docs/technical/native-testing.md
- [[Native microphone permission readiness]] - rationale - docs/technical/native-testing.md
- [[PracticeConnectionStatus]] - code - src/services/realtime/realtimeClient.ts
- [[PracticeSessionContext]] - code - src/services/realtime/realtimeClient.ts
- [[Real device LAN testing]] - rationale - docs/technical/native-testing.md
- [[RealtimeSessionInfo]] - code - src/services/realtime/realtimeClient.ts
- [[Supabase sync verification]] - rationale - docs/technical/native-testing.md
- [[addLivePcmAudioChunkListener()]] - code - src/services/audio/livePcmAudio.ts
- [[addLivePcmAudioErrorListener()]] - code - src/services/audio/livePcmAudio.ts
- [[addLivePcmAudioStateListener()]] - code - src/services/audio/livePcmAudio.ts
- [[checkLessonPronunciation()]] - code - src/services/realtime/realtimeClient.ts
- [[checkPracticeConnection()]] - code - src/services/realtime/realtimeClient.ts
- [[clearLivePcmAudioPlayback()]] - code - src/services/audio/livePcmAudio.ts
- [[connectLiveWebRtc()]] - code - src/services/realtime/liveWebRtc.ts
- [[connectLiveWebRtc()_1]] - code - src/services/realtime/liveWebRtc.native.ts
- [[connectLiveWebRtc()_2]] - code - src/services/realtime/liveWebRtc.web.ts
- [[connectLiveWebSocket()]] - code - src/services/realtime/liveWebSocket.ts
- [[createLessonAudio()]] - code - src/services/realtime/realtimeClient.ts
- [[createRealtimeSession()]] - code - src/services/realtime/realtimeClient.ts
- [[createRealtimeWebRtcAnswer()]] - code - src/services/realtime/realtimeClient.ts
- [[generateSessionFeedback()]] - code - src/services/realtime/realtimeClient.ts
- [[getAudioUploadInfo()]] - code - src/services/realtime/realtimeClient.ts
- [[getConfiguredEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getErrorMessage()]] - code - src/services/realtime/realtimeClient.ts
- [[getHealthEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getInitialPracticeConnectionStatus()]] - code - src/services/realtime/realtimeClient.ts
- [[getRealtimeCallEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[getRealtimeWebSocketEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[hasPracticeEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[iOS simulator voice testing]] - rationale - docs/technical/native-testing.md
- [[isLivePcmAudioAvailable()]] - code - src/services/audio/livePcmAudio.ts
- [[live.tsx]] - code - app/(tabs)/speak/live.tsx
- [[livePcmAudio.ts]] - code - src/services/audio/livePcmAudio.ts
- [[liveWebRtc.native.ts]] - code - src/services/realtime/liveWebRtc.native.ts
- [[liveWebRtc.ts]] - code - src/services/realtime/liveWebRtc.ts
- [[liveWebRtc.web.ts]] - code - src/services/realtime/liveWebRtc.web.ts
- [[liveWebSocket.ts]] - code - src/services/realtime/liveWebSocket.ts
- [[playLivePcmAudioChunk()]] - code - src/services/audio/livePcmAudio.ts
- [[realtimeClient.ts]] - code - src/services/realtime/realtimeClient.ts
- [[sendTextTurn()]] - code - src/services/realtime/realtimeClient.ts
- [[sendVoiceTurn()]] - code - src/services/realtime/realtimeClient.ts
- [[startLivePcmAudioCapture()]] - code - src/services/audio/livePcmAudio.ts
- [[stopLivePcmAudio()]] - code - src/services/audio/livePcmAudio.ts
- [[stopLivePcmAudioCapture()]] - code - src/services/audio/livePcmAudio.ts
- [[styles_20]] - code - app/(tabs)/speak/live.tsx

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Live_Voice_Testing
SORT file.name ASC
```

## Connections to other communities
- 15 edges to [[_COMMUNITY_Speak Conversation UI]]
- 3 edges to [[_COMMUNITY_Lesson Runtime]]
- 2 edges to [[_COMMUNITY_Onboarding Speak Shell]]
- 1 edge to [[_COMMUNITY_UX Voice Controls]]
- 1 edge to [[_COMMUNITY_Learn Review Screens]]
- 1 edge to [[_COMMUNITY_Technical Architecture Docs]]
- 1 edge to [[_COMMUNITY_Route Entry Points]]

## Top bridge nodes
- [[live.tsx]] - degree 25, connects to 3 communities
- [[realtimeClient.ts]] - degree 33, connects to 2 communities
- [[Native Testing Checklist]] - degree 10, connects to 2 communities
- [[checkLessonPronunciation()]] - degree 7, connects to 2 communities
- [[sendVoiceTurn()]] - degree 7, connects to 2 communities