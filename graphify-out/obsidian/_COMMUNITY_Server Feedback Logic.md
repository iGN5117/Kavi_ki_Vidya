---
type: community
cohesion: 0.17
members: 21
---

# Server Feedback Logic

**Cohesion:** 0.17 - loosely connected
**Members:** 21 nodes

## Members
- [[applyCommonLocalGrammarFixes()]] - code - server/dev-server.js
- [[buildLocalGrammarCorrection()]] - code - server/dev-server.js
- [[cleanFeedbackSentence()]] - code - server/dev-server.js
- [[extractQuotedFeedbackSentences()]] - code - server/dev-server.js
- [[getAverageFeedbackScore()]] - code - server/dev-server.js
- [[getCoachSuggestedFeedbackSentence()]] - code - server/dev-server.js
- [[getFeedbackWordCount()]] - code - server/dev-server.js
- [[getLocalFeedbackMistakes()]] - code - server/dev-server.js
- [[getLocalFeedbackRetryWords()]] - code - server/dev-server.js
- [[getLocalFeedbackSavedPhrases()]] - code - server/dev-server.js
- [[getLocalGrammarExplanation()]] - code - server/dev-server.js
- [[getLocalImprovedSentence()]] - code - server/dev-server.js
- [[getTurnPronunciationChecks()]] - code - server/dev-server.js
- [[hasMeaningfulFeedbackOverlap()]] - code - server/dev-server.js
- [[isSmallFeedbackGreeting()]] - code - server/dev-server.js
- [[isUsefulLocalSavedPhrase()]] - code - server/dev-server.js
- [[localFeedback()]] - code - server/dev-server.js
- [[personalizeFeedbackWithTurnPronunciation()_1]] - code - server/dev-server.js
- [[sentenceCase()_1]] - code - server/dev-server.js
- [[simplifyFeedbackSentence()]] - code - server/dev-server.js
- [[withSentencePunctuation()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Server_Feedback_Logic
SORT file.name ASC
```

## Connections to other communities
- 21 edges to [[_COMMUNITY_Dev Server API]]
- 3 edges to [[_COMMUNITY_Voice Turn Pipeline]]
- 2 edges to [[_COMMUNITY_Server Sanitizers]]
- 1 edge to [[_COMMUNITY_Technical Architecture Docs]]

## Top bridge nodes
- [[simplifyFeedbackSentence()]] - degree 11, connects to 3 communities
- [[cleanFeedbackSentence()]] - degree 8, connects to 3 communities
- [[localFeedback()]] - degree 11, connects to 2 communities
- [[getLocalImprovedSentence()]] - degree 8, connects to 2 communities
- [[personalizeFeedbackWithTurnPronunciation()_1]] - degree 7, connects to 1 community