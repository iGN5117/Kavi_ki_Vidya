---
type: community
cohesion: 0.25
members: 8
---

# server_dev_server_clamprawtext

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[clampRawText()]] - code - server/dev-server.js
- [[createRealtimeInputFormatUpdate()]] - code - server/dev-server.js
- [[getRealtimeAudioRate()]] - code - server/dev-server.js
- [[getRealtimeWebSocketInputRate()]] - code - server/dev-server.js
- [[normalizeSdpText()]] - code - server/dev-server.js
- [[prepareRealtimeInputAudio()]] - code - server/dev-server.js
- [[readUInt16LE()]] - code - server/dev-server.js
- [[readUInt32LE()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/server_dev_server_clamprawtext
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_server_dev_server_access]]
- 1 edge to [[_COMMUNITY_app_layout_rootlayout]]

## Top bridge nodes
- [[getRealtimeAudioRate()]] - degree 5, connects to 2 communities
- [[prepareRealtimeInputAudio()]] - degree 5, connects to 1 community
- [[clampRawText()]] - degree 3, connects to 1 community
- [[createRealtimeInputFormatUpdate()]] - degree 2, connects to 1 community
- [[getRealtimeWebSocketInputRate()]] - degree 2, connects to 1 community