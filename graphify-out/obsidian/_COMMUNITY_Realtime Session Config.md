---
type: community
cohesion: 0.15
members: 13
---

# Realtime Session Config

**Cohesion:** 0.15 - loosely connected
**Members:** 13 nodes

## Members
- [[clampRawText()]] - code - server/dev-server.js
- [[createRealtimeInputFormatUpdate()]] - code - server/dev-server.js
- [[createRealtimeInstructionsUpdate()]] - code - server/dev-server.js
- [[createRealtimeSessionConfig()]] - code - server/dev-server.js
- [[createRealtimeSessionUpdate()]] - code - server/dev-server.js
- [[getRealtimeAudioRate()]] - code - server/dev-server.js
- [[getRealtimeWebSocketInputRate()]] - code - server/dev-server.js
- [[normalizeSdpText()]] - code - server/dev-server.js
- [[prepareRealtimeInputAudio()]] - code - server/dev-server.js
- [[readUInt16LE()]] - code - server/dev-server.js
- [[readUInt32LE()]] - code - server/dev-server.js
- [[withStructuredCoachInstructions()]] - code - server/dev-server.js
- [[withTeachingStructureInstructions()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Realtime_Session_Config
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Dev Server API]]
- 1 edge to [[_COMMUNITY_Technical Architecture Docs]]
- 1 edge to [[_COMMUNITY_Voice Turn Pipeline]]

## Top bridge nodes
- [[createRealtimeSessionConfig()]] - degree 5, connects to 2 communities
- [[withStructuredCoachInstructions()]] - degree 3, connects to 2 communities
- [[getRealtimeAudioRate()]] - degree 5, connects to 1 community
- [[prepareRealtimeInputAudio()]] - degree 5, connects to 1 community
- [[withTeachingStructureInstructions()]] - degree 4, connects to 1 community