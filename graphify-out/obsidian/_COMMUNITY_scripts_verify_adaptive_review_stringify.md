---
type: community
cohesion: 0.14
members: 43
---

# scripts_verify_adaptive_review_stringify

**Cohesion:** 0.14 - loosely connected
**Members:** 43 nodes

## Members
- [[WebSocket]] - code - scripts/verify-local-api.js
- [[assert()]] - code - scripts/verify-local-api.js
- [[assertDoesNotCreateSelfGreetingDrill()]] - code - scripts/verify-speak-regressions.js
- [[assertDoesNotMention()]] - code - scripts/verify-speak-regressions.js
- [[assertDoesNotRepeatHighScoredSentence()]] - code - scripts/verify-speak-regressions.js
- [[assertIHeardTranscriptIsEnglishScript()]] - code - scripts/verify-speak-regressions.js
- [[assertImprovedSentence()]] - code - scripts/verify-speak-regressions.js
- [[assertNarratesModelSentence()]] - code - scripts/verify-speak-regressions.js
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
- [[postJson()]] - code - scripts/verify-speak-regressions.js
- [[postVoiceTurn()]] - code - scripts/verify-speak-regressions.js
- [[progressUrl()]] - code - scripts/verify-local-api.js
- [[requestJson()]] - code - scripts/verify-local-api.js
- [[requestRaw()]] - code - scripts/verify-speak-regressions.js
- [[requestTimeoutMs]] - code - scripts/verify-speak-regressions.js
- [[rootBaseUrl]] - code - scripts/verify-local-api.js
- [[stringify()]] - code - scripts/verify-adaptive-review.js
- [[verify-local-api.js]] - code - scripts/verify-local-api.js
- [[verify-speak-regressions.js]] - code - scripts/verify-speak-regressions.js
- [[verifyDeterministicSpeakGuards()]] - code - scripts/verify-speak-regressions.js
- [[verifyGrammarReviewCorrections()]] - code - scripts/verify-speak-regressions.js
- [[verifyGreetingReviewUsesActualSession()]] - code - scripts/verify-speak-regressions.js
- [[verifyRealtimeWebSocketAudioTurn()]] - code - scripts/verify-local-api.js
- [[verifyRealtimeWebSocketSession()]] - code - scripts/verify-local-api.js
- [[verifyRealtimeWebSocketTextResponse()]] - code - scripts/verify-local-api.js
- [[verifyShortTextTurnHandling()]] - code - scripts/verify-speak-regressions.js
- [[verifyTextTurnSupportText()]] - code - scripts/verify-speak-regressions.js
- [[verifyVoiceTurnRegression()]] - code - scripts/verify-speak-regressions.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/scripts_verify_adaptive_review_stringify
SORT file.name ASC
```

## Connections to other communities
- 20 edges to [[_COMMUNITY_content_lessonskillprofiles_getlessonskilltags]]
- 2 edges to [[_COMMUNITY_adaptive_practiceplan_getlearnerpracticeplan]]
- 1 edge to [[_COMMUNITY_auth_sessionclient_createdevsession]]
- 1 edge to [[_COMMUNITY_server_dev_server_access]]

## Top bridge nodes
- [[assert()]] - degree 31, connects to 2 communities
- [[verify-speak-regressions.js]] - degree 30, connects to 1 community
- [[main()]] - degree 20, connects to 1 community
- [[stringify()]] - degree 19, connects to 1 community
- [[includesText()]] - degree 8, connects to 1 community