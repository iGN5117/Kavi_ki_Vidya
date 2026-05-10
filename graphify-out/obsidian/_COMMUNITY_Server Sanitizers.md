---
type: community
cohesion: 0.22
members: 16
---

# Server Sanitizers

**Cohesion:** 0.22 - loosely connected
**Members:** 16 nodes

## Members
- [[asStringArray()]] - code - server/dev-server.js
- [[clampText()]] - code - server/dev-server.js
- [[extractJsonObject()]] - code - server/dev-server.js
- [[getFirstSupportSentence()]] - code - server/dev-server.js
- [[getOptionalScore()]] - code - server/dev-server.js
- [[getRealtimeWebSocketInstructions()]] - code - server/dev-server.js
- [[getSafeAudioFilename()]] - code - server/dev-server.js
- [[getSupportTextFallback()]] - code - server/dev-server.js
- [[hasConversationContinuation()]] - code - server/dev-server.js
- [[hasMostlyNonLatinScript()]] - code - server/dev-server.js
- [[parseTurnPronunciation()]] - code - server/dev-server.js
- [[sanitizeCoachReply()]] - code - server/dev-server.js
- [[sanitizeFeedback()]] - code - server/dev-server.js
- [[sanitizePronunciationCheck()]] - code - server/dev-server.js
- [[sanitizeSupportText()]] - code - server/dev-server.js
- [[transcribeAudioFile()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Server_Sanitizers
SORT file.name ASC
```

## Connections to other communities
- 16 edges to [[_COMMUNITY_Dev Server API]]
- 6 edges to [[_COMMUNITY_Voice Turn Pipeline]]
- 3 edges to [[_COMMUNITY_Pronunciation Scoring]]
- 2 edges to [[_COMMUNITY_Progress Sanitization]]
- 2 edges to [[_COMMUNITY_Server Feedback Logic]]

## Top bridge nodes
- [[clampText()]] - degree 19, connects to 5 communities
- [[sanitizeSupportText()]] - degree 7, connects to 2 communities
- [[sanitizePronunciationCheck()]] - degree 6, connects to 2 communities
- [[getOptionalScore()]] - degree 5, connects to 2 communities
- [[sanitizeCoachReply()]] - degree 5, connects to 2 communities