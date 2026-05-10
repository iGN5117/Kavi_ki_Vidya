---
type: community
cohesion: 0.21
members: 13
---

# Voice Turn Pipeline

**Cohesion:** 0.21 - loosely connected
**Members:** 13 nodes

## Members
- [[createAudioPronunciationAssessment()]] - code - server/dev-server.js
- [[createCoachAudioUrl()]] - code - server/dev-server.js
- [[createCoachReply()]] - code - server/dev-server.js
- [[ensureRetryReplyNarratesSentence()]] - code - server/dev-server.js
- [[formatConversationTurns()]] - code - server/dev-server.js
- [[formatPronunciationContext()]] - code - server/dev-server.js
- [[getAudioAssessmentFormat()]] - code - server/dev-server.js
- [[getCoachReplyFromAssessment()]] - code - server/dev-server.js
- [[getPronunciationModelSentence()]] - code - server/dev-server.js
- [[getSafeOpenAIError()]] - code - server/dev-server.js
- [[localCoachReply()]] - code - server/dev-server.js
- [[needsPronunciationRetry()]] - code - server/dev-server.js
- [[withTimeout()_1]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Voice_Turn_Pipeline
SORT file.name ASC
```

## Connections to other communities
- 13 edges to [[_COMMUNITY_Dev Server API]]
- 6 edges to [[_COMMUNITY_Server Sanitizers]]
- 3 edges to [[_COMMUNITY_Server Feedback Logic]]
- 2 edges to [[_COMMUNITY_Technical Architecture Docs]]
- 1 edge to [[_COMMUNITY_Realtime Session Config]]

## Top bridge nodes
- [[createCoachReply()]] - degree 9, connects to 4 communities
- [[createAudioPronunciationAssessment()]] - degree 6, connects to 3 communities
- [[ensureRetryReplyNarratesSentence()]] - degree 6, connects to 3 communities
- [[getPronunciationModelSentence()]] - degree 6, connects to 2 communities
- [[localCoachReply()]] - degree 5, connects to 2 communities