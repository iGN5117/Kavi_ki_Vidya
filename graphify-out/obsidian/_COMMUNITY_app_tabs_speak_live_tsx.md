---
type: community
cohesion: 0.13
members: 30
---

# app_tabs_speak_live_tsx

**Cohesion:** 0.13 - loosely connected
**Members:** 30 nodes

## Members
- [[AudioChunkEvent]] - code - src/services/audio/livePcmAudio.native.ts
- [[ErrorEvent]] - code - src/services/audio/livePcmAudio.native.ts
- [[KaviLiveAudioNativeModule]] - code - src/services/audio/livePcmAudio.native.ts
- [[LiveConversationScreen()]] - code - app/(tabs)/speak/live.tsx
- [[LiveLog]] - code - app/(tabs)/speak/live.tsx
- [[LiveRealtimeEvent]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveState]] - code - app/(tabs)/speak/live.tsx
- [[LiveWebRtcConnection]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveWebRtcOptions]] - code - src/services/realtime/liveWebRtc.ts
- [[LiveWebSocketOptions]] - code - src/services/realtime/liveWebSocket.ts
- [[StateEvent]] - code - src/services/audio/livePcmAudio.native.ts
- [[addLivePcmAudioChunkListener()]] - code - src/services/audio/livePcmAudio.ts
- [[addLivePcmAudioErrorListener()]] - code - src/services/audio/livePcmAudio.ts
- [[addLivePcmAudioStateListener()]] - code - src/services/audio/livePcmAudio.ts
- [[clearLivePcmAudioPlayback()]] - code - src/services/audio/livePcmAudio.ts
- [[connectLiveWebRtc()]] - code - src/services/realtime/liveWebRtc.ts
- [[createRealtimeWebRtcAnswer()]] - code - src/services/realtime/realtimeClient.ts
- [[getRealtimeWebSocketEndpoint()]] - code - src/services/realtime/realtimeClient.ts
- [[isLivePcmAudioAvailable()]] - code - src/services/audio/livePcmAudio.ts
- [[live.tsx]] - code - app/(tabs)/speak/live.tsx
- [[livePcmAudio.ts]] - code - src/services/audio/livePcmAudio.ts
- [[liveWebRtc.native.ts]] - code - src/services/realtime/liveWebRtc.native.ts
- [[liveWebRtc.ts]] - code - src/services/realtime/liveWebRtc.ts
- [[liveWebRtc.web.ts]] - code - src/services/realtime/liveWebRtc.web.ts
- [[liveWebSocket.ts]] - code - src/services/realtime/liveWebSocket.ts
- [[nativeModule]] - code - src/services/audio/livePcmAudio.native.ts
- [[playLivePcmAudioChunk()]] - code - src/services/audio/livePcmAudio.ts
- [[startLivePcmAudioCapture()]] - code - src/services/audio/livePcmAudio.ts
- [[stopLivePcmAudio()]] - code - src/services/audio/livePcmAudio.ts
- [[stopLivePcmAudioCapture()]] - code - src/services/audio/livePcmAudio.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/app_tabs_speak_live_tsx
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_app_layout_rootlayout]]
- 5 edges to [[_COMMUNITY_app_index_styles]]

## Top bridge nodes
- [[live.tsx]] - degree 24, connects to 2 communities
- [[liveWebSocket.ts]] - degree 9, connects to 1 community
- [[liveWebRtc.native.ts]] - degree 7, connects to 1 community
- [[liveWebRtc.web.ts]] - degree 7, connects to 1 community
- [[createRealtimeWebRtcAnswer()]] - degree 5, connects to 1 community