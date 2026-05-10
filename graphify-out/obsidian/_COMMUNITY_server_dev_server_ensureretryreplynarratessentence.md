---
type: community
cohesion: 0.33
members: 7
---

# server_dev_server_ensureretryreplynarratessentence

**Cohesion:** 0.33 - loosely connected
**Members:** 7 nodes

## Members
- [[ensureRetryReplyNarratesSentence()]] - code - server/dev-server.js
- [[formatPronunciationContext()]] - code - server/dev-server.js
- [[getCoachReplyFromAssessment()]] - code - server/dev-server.js
- [[getPronunciationModelSentence()]] - code - server/dev-server.js
- [[localCoachReply()]] - code - server/dev-server.js
- [[localPronunciationCheck()]] - code - server/dev-server.js
- [[needsPronunciationRetry()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/server_dev_server_ensureretryreplynarratessentence
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_server_dev_server_access]]
- 4 edges to [[_COMMUNITY_server_dev_server_asstringarray]]
- 2 edges to [[_COMMUNITY_server_dev_server_createaudiopronunciationassessment]]
- 2 edges to [[_COMMUNITY_server_dev_server_buildlocalgrammarcorrection]]
- 2 edges to [[_COMMUNITY_adaptive_practiceplan_getlearnerpracticeplan]]
- 1 edge to [[_COMMUNITY_server_dev_server_clampnumber]]

## Top bridge nodes
- [[localPronunciationCheck()]] - degree 5, connects to 4 communities
- [[getPronunciationModelSentence()]] - degree 7, connects to 3 communities
- [[ensureRetryReplyNarratesSentence()]] - degree 6, connects to 3 communities
- [[localCoachReply()]] - degree 5, connects to 3 communities
- [[formatPronunciationContext()]] - degree 3, connects to 2 communities