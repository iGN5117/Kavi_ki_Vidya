---
type: community
cohesion: 0.33
members: 7
---

# components_conversationbubble_getmodelsentence

**Cohesion:** 0.33 - loosely connected
**Members:** 7 nodes

## Members
- [[clampNumber()]] - code - server/dev-server.js
- [[getEditDistance()]] - code - server/dev-server.js
- [[getModelSentence()]] - code - src/components/ConversationBubble.tsx
- [[getPhraseSimilarityScore()]] - code - server/dev-server.js
- [[getWordOverlapScore()]] - code - server/dev-server.js
- [[normalizeSpeechText()]] - code - server/dev-server.js
- [[scorePronunciationAttempt()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/components_conversationbubble_getmodelsentence
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_server_dev_server_access]]
- 2 edges to [[_COMMUNITY_server_dev_server_clamptext]]
- 2 edges to [[_COMMUNITY_app_tabs_speak_conversation_tsx]]
- 1 edge to [[_COMMUNITY_server_dev_server_getbearertoken]]
- 1 edge to [[_COMMUNITY_server_dev_server_asstringarray]]
- 1 edge to [[_COMMUNITY_feedback_samplefeedback_applycommongrammarfixes]]

## Top bridge nodes
- [[normalizeSpeechText()]] - degree 7, connects to 4 communities
- [[clampNumber()]] - degree 4, connects to 3 communities
- [[scorePronunciationAttempt()]] - degree 5, connects to 2 communities
- [[getPhraseSimilarityScore()]] - degree 4, connects to 1 community
- [[getWordOverlapScore()]] - degree 3, connects to 1 community