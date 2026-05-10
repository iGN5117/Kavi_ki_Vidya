---
type: community
cohesion: 0.32
members: 8
---

# Pronunciation Scoring

**Cohesion:** 0.32 - loosely connected
**Members:** 8 nodes

## Members
- [[clampNumber()]] - code - server/dev-server.js
- [[getEditDistance()]] - code - server/dev-server.js
- [[getPhraseSimilarityScore()]] - code - server/dev-server.js
- [[getRetryWords()_1]] - code - server/dev-server.js
- [[getWordOverlapScore()]] - code - server/dev-server.js
- [[localPronunciationCheck()]] - code - server/dev-server.js
- [[normalizeSpeechText()]] - code - server/dev-server.js
- [[scorePronunciationAttempt()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Pronunciation_Scoring
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_Dev Server API]]
- 3 edges to [[_COMMUNITY_Server Sanitizers]]
- 1 edge to [[_COMMUNITY_Progress Sanitization]]

## Top bridge nodes
- [[clampNumber()]] - degree 4, connects to 3 communities
- [[normalizeSpeechText()]] - degree 5, connects to 2 communities
- [[localPronunciationCheck()]] - degree 4, connects to 2 communities
- [[scorePronunciationAttempt()]] - degree 5, connects to 1 community
- [[getPhraseSimilarityScore()]] - degree 4, connects to 1 community