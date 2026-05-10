---
type: community
cohesion: 0.14
members: 38
---

# scripts_verify_content_main

**Cohesion:** 0.14 - loosely connected
**Members:** 38 nodes

## Members
- [[WebSocket]] - code - scripts/verify-local-api.js
- [[assert()]] - code - scripts/verify-local-api.js
- [[assertDoesNotMention()]] - code - scripts/verify-speak-regressions.js
- [[assertImprovedSentence()]] - code - scripts/verify-speak-regressions.js
- [[assertNoHiddenSupportContinuation()]] - code - scripts/verify-speak-regressions.js
- [[authUrl()]] - code - scripts/verify-local-api.js
- [[createSentenceAudio()]] - code - scripts/verify-speak-regressions.js
- [[createToneWavBase64()]] - code - scripts/verify-local-api.js
- [[delay()]] - code - scripts/verify-speak-regressions.js
- [[expectHealth()]] - code - scripts/verify-speak-regressions.js
- [[expectStatus()]] - code - scripts/verify-local-api.js
- [[getGrammarImprovements()]] - code - scripts/verify-speak-regressions.js
- [[getManualRealtimeWebSocketUrl()]] - code - scripts/verify-local-api.js
- [[getRealtimeWebSocketUrl()]] - code - server/dev-server.js
- [[getRootBaseUrl()]] - code - scripts/verify-local-api.js
- [[http]] - code - scripts/verify-local-api.js
- [[https]] - code - scripts/verify-local-api.js
- [[includesText()]] - code - scripts/verify-speak-regressions.js
- [[isMostlyLatin()]] - code - scripts/verify-speak-regressions.js
- [[main()]] - code - scripts/verify-content.js
- [[normalizeText()]] - code - scripts/verify-speak-regressions.js
- [[postJson()]] - code - scripts/verify-speak-regressions.js
- [[postVoiceTurn()]] - code - scripts/verify-speak-regressions.js
- [[progressUrl()]] - code - scripts/verify-local-api.js
- [[requestJson()]] - code - scripts/verify-local-api.js
- [[requestRaw()]] - code - scripts/verify-speak-regressions.js
- [[requestTimeoutMs]] - code - scripts/verify-speak-regressions.js
- [[rootBaseUrl]] - code - scripts/verify-local-api.js
- [[stringify()]] - code - scripts/verify-speak-regressions.js
- [[verify-local-api.js]] - code - scripts/verify-local-api.js
- [[verify-speak-regressions.js]] - code - scripts/verify-speak-regressions.js
- [[verifyGrammarReviewCorrections()]] - code - scripts/verify-speak-regressions.js
- [[verifyGreetingReviewUsesActualSession()]] - code - scripts/verify-speak-regressions.js
- [[verifyRealtimeWebSocketAudioTurn()]] - code - scripts/verify-local-api.js
- [[verifyRealtimeWebSocketSession()]] - code - scripts/verify-local-api.js
- [[verifyRealtimeWebSocketTextResponse()]] - code - scripts/verify-local-api.js
- [[verifyTextTurnSupportText()]] - code - scripts/verify-speak-regressions.js
- [[verifyVoiceTurnRegression()]] - code - scripts/verify-speak-regressions.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/scripts_verify_content_main
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_scripts_verify_content_arrayshavesamecounts]]
- 1 edge to [[_COMMUNITY_server_dev_server_access]]

## Top bridge nodes
- [[main()]] - degree 18, connects to 1 community
- [[getRealtimeWebSocketUrl()]] - degree 3, connects to 1 community