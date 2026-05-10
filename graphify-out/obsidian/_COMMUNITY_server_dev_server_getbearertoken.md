---
type: community
cohesion: 0.29
members: 8
---

# server_dev_server_getbearertoken

**Cohesion:** 0.29 - loosely connected
**Members:** 8 nodes

## Members
- [[getBearerToken()]] - code - server/dev-server.js
- [[getSessionFromRequest()]] - code - server/dev-server.js
- [[resolveProgressAccess()]] - code - server/dev-server.js
- [[sanitizeDateKey()]] - code - server/dev-server.js
- [[sanitizeJsonArray()]] - code - server/dev-server.js
- [[sanitizeProfileId()]] - code - server/dev-server.js
- [[sanitizeProgressPayload()]] - code - server/dev-server.js
- [[sanitizeStringArray()]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/server_dev_server_getbearertoken
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_server_dev_server_access]]
- 3 edges to [[_COMMUNITY_server_dev_server_asstringarray]]

## Top bridge nodes
- [[sanitizeProgressPayload()]] - degree 7, connects to 2 communities
- [[sanitizeProfileId()]] - degree 4, connects to 2 communities
- [[resolveProgressAccess()]] - degree 4, connects to 1 community
- [[getBearerToken()]] - degree 3, connects to 1 community
- [[getSessionFromRequest()]] - degree 3, connects to 1 community