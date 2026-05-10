---
type: community
cohesion: 0.14
members: 21
---

# scripts_verify_content_arrayshavesamecounts

**Cohesion:** 0.14 - loosely connected
**Members:** 21 nodes

## Members
- [[SupportLanguage]] - code - src/types/content.ts
- [[arraysHaveSameCounts()]] - code - scripts/verify-content.js
- [[createFileProgressRepository()]] - code - server/progress-store.js
- [[createSupabaseProgressRepository()]] - code - server/progress-store.js
- [[fs]] - code - server/dev-server.js
- [[isNonEmptyString()]] - code - scripts/verify-content.js
- [[labelActivity()]] - code - scripts/verify-content.js
- [[labelLesson()]] - code - scripts/verify-content.js
- [[loadTsModule()]] - code - scripts/verify-content.js
- [[path]] - code - server/dev-server.js
- [[progress-store.js]] - code - server/progress-store.js
- [[repoRoot]] - code - scripts/verify-content.js
- [[resolveTsPath()]] - code - scripts/verify-content.js
- [[sortedCounts()]] - code - scripts/verify-content.js
- [[ts]] - code - scripts/verify-content.js
- [[validateContent()]] - code - scripts/verify-content.js
- [[validateExplanation()]] - code - scripts/verify-content.js
- [[validateOptionsActivity()]] - code - scripts/verify-content.js
- [[validateTeachingSentence()]] - code - scripts/verify-content.js
- [[verify-content.js]] - code - scripts/verify-content.js
- [[{ createProgressRepository }]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/scripts_verify_content_arrayshavesamecounts
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_server_dev_server_access]]
- 3 edges to [[_COMMUNITY_scripts_verify_content_main]]
- 2 edges to [[_COMMUNITY_app_index_index]]

## Top bridge nodes
- [[verify-content.js]] - degree 18, connects to 2 communities
- [[progress-store.js]] - degree 6, connects to 1 community
- [[{ createProgressRepository }]] - degree 4, connects to 1 community
- [[fs]] - degree 3, connects to 1 community
- [[path]] - degree 3, connects to 1 community