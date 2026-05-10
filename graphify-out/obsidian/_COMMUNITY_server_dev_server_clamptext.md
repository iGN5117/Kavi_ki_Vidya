---
type: community
cohesion: 0.18
members: 17
---

# server_dev_server_clamptext

**Cohesion:** 0.18 - loosely connected
**Members:** 17 nodes

## Members
- [[clampText()]] - code - server/dev-server.js
- [[ensureRetryReplyNarratesSentence()]] - code - server/dev-server.js
- [[formatPronunciationContext()]] - code - server/dev-server.js
- [[getCoachReplyFromAssessment()]] - code - server/dev-server.js
- [[getFirstSupportSentence()]] - code - server/dev-server.js
- [[getPronunciationModelSentence()]] - code - server/dev-server.js
- [[getRealtimeWebSocketInstructions()]] - code - server/dev-server.js
- [[getSafeAudioFilename()]] - code - server/dev-server.js
- [[getSupportTextFallback()]] - code - server/dev-server.js
- [[hasConversationContinuation()]] - code - server/dev-server.js
- [[hasMostlyNonLatinScript()]] - code - server/dev-server.js
- [[localCoachReply()]] - code - server/dev-server.js
- [[localPronunciationCheck()]] - code - server/dev-server.js
- [[needsPronunciationRetry()]] - code - server/dev-server.js
- [[sanitizeCoachReply()]] - code - server/dev-server.js
- [[sanitizeSupportText()]] - code - server/dev-server.js
- [[transcribeAudioFile()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/server_dev_server_clamptext
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_server_dev_server_access]]
- 6 edges to [[_COMMUNITY_feedback_samplefeedback_applycommongrammarfixes]]
- 4 edges to [[_COMMUNITY_server_dev_server_asstringarray]]
- 4 edges to [[_COMMUNITY_server_dev_server_createaudiopronunciationassessment]]
- 2 edges to [[_COMMUNITY_server_dev_server_getbearertoken]]
- 2 edges to [[_COMMUNITY_components_conversationbubble_getmodelsentence]]

## Top bridge nodes
- [[clampText()]] - degree 19, connects to 5 communities
- [[localPronunciationCheck()]] - degree 5, connects to 3 communities
- [[sanitizeCoachReply()]] - degree 5, connects to 3 communities
- [[getPronunciationModelSentence()]] - degree 7, connects to 2 communities
- [[ensureRetryReplyNarratesSentence()]] - degree 6, connects to 2 communities