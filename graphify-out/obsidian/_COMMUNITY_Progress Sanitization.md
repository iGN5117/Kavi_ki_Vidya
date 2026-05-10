---
type: community
cohesion: 0.25
members: 9
---

# Progress Sanitization

**Cohesion:** 0.25 - loosely connected
**Members:** 9 nodes

## Members
- [[getBearerToken()]] - code - server/dev-server.js
- [[getSessionFromRequest()]] - code - server/dev-server.js
- [[resolveProgressAccess()]] - code - server/dev-server.js
- [[sanitizeAuthProfile()]] - code - server/dev-server.js
- [[sanitizeDateKey()]] - code - server/dev-server.js
- [[sanitizeJsonArray()]] - code - server/dev-server.js
- [[sanitizeProfileId()]] - code - server/dev-server.js
- [[sanitizeProgressPayload()]] - code - server/dev-server.js
- [[sanitizeStringArray()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Progress_Sanitization
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Dev Server API]]
- 2 edges to [[_COMMUNITY_Server Sanitizers]]
- 1 edge to [[_COMMUNITY_Pronunciation Scoring]]
- 1 edge to [[_COMMUNITY_Technical Architecture Docs]]

## Top bridge nodes
- [[sanitizeProgressPayload()]] - degree 8, connects to 4 communities
- [[sanitizeAuthProfile()]] - degree 4, connects to 2 communities
- [[resolveProgressAccess()]] - degree 4, connects to 1 community
- [[getBearerToken()]] - degree 3, connects to 1 community
- [[getSessionFromRequest()]] - degree 3, connects to 1 community