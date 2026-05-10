---
type: community
cohesion: 0.14
members: 26
---

# scripts_verify_adaptive_review_assertusefulpracticehref

**Cohesion:** 0.14 - loosely connected
**Members:** 26 nodes

## Members
- [[arraysHaveSameCounts()]] - code - scripts/verify-content.js
- [[assertUsefulPracticeHref()]] - code - scripts/verify-adaptive-review.js
- [[createFileProgressRepository()]] - code - server/progress-store.js
- [[createSupabaseProgressRepository()]] - code - server/progress-store.js
- [[fs]] - code - server/dev-server.js
- [[getLessonModuleById()]] - code - scripts/verify-adaptive-review.js
- [[isNonEmptyString()]] - code - scripts/verify-content.js
- [[labelActivity()]] - code - scripts/verify-content.js
- [[labelLesson()]] - code - scripts/verify-content.js
- [[loadTsModule()]] - code - scripts/verify-content.js
- [[makeFeedback()]] - code - scripts/verify-adaptive-review.js
- [[makePlanInput()]] - code - scripts/verify-adaptive-review.js
- [[path]] - code - server/dev-server.js
- [[progress-store.js]] - code - server/progress-store.js
- [[repoRoot]] - code - scripts/verify-content.js
- [[resolveTsPath()]] - code - scripts/verify-content.js
- [[run()]] - code - scripts/verify-adaptive-review.js
- [[sortedCounts()]] - code - scripts/verify-content.js
- [[ts]] - code - scripts/verify-content.js
- [[validateContent()]] - code - scripts/verify-content.js
- [[validateExplanation()]] - code - scripts/verify-content.js
- [[validateOptionsActivity()]] - code - scripts/verify-content.js
- [[validateTeachingSentence()]] - code - scripts/verify-content.js
- [[verify-adaptive-review.js]] - code - scripts/verify-adaptive-review.js
- [[verify-content.js]] - code - scripts/verify-content.js
- [[{ createProgressRepository }]] - code - server/dev-server.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/scripts_verify_adaptive_review_assertusefulpracticehref
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_scripts_verify_adaptive_review_stringify]]
- 4 edges to [[_COMMUNITY_server_dev_server_access]]
- 3 edges to [[_COMMUNITY_app_index_index]]
- 2 edges to [[_COMMUNITY_adaptive_practiceplan_adaptivelessonrecommendation]]

## Top bridge nodes
- [[verify-content.js]] - degree 18, connects to 2 communities
- [[verify-adaptive-review.js]] - degree 14, connects to 2 communities
- [[run()]] - degree 10, connects to 2 communities
- [[progress-store.js]] - degree 6, connects to 1 community
- [[assertUsefulPracticeHref()]] - degree 4, connects to 1 community