---
type: community
cohesion: 0.40
members: 5
---

# server_dev_server_geteditdistance

**Cohesion:** 0.40 - moderately connected
**Members:** 5 nodes

## Members
- [[getEditDistance()]] - code - server/dev-server.js
- [[getPhraseSimilarityScore()]] - code - server/dev-server.js
- [[getWordOverlapScore()]] - code - server/dev-server.js
- [[localPronunciationCheck()]] - code - server/dev-server.js
- [[scorePronunciationAttempt()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/server_dev_server_geteditdistance
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_server_dev_server_access]]
- 2 edges to [[_COMMUNITY_app_tabs_speak_conversation_tsx]]
- 1 edge to [[_COMMUNITY_server_dev_server_clamptext]]
- 1 edge to [[_COMMUNITY_server_dev_server_asstringarray]]
- 1 edge to [[_COMMUNITY_server_dev_server_createcoachaudiourl]]
- 1 edge to [[_COMMUNITY_feedback_samplefeedback_applycommongrammarfixes]]

## Top bridge nodes
- [[localPronunciationCheck()]] - degree 5, connects to 4 communities
- [[scorePronunciationAttempt()]] - degree 5, connects to 2 communities
- [[getPhraseSimilarityScore()]] - degree 4, connects to 2 communities
- [[getWordOverlapScore()]] - degree 3, connects to 2 communities
- [[getEditDistance()]] - degree 2, connects to 1 community