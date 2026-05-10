---
type: community
cohesion: 0.08
members: 26
---

# Technical Architecture Docs

**Cohesion:** 0.08 - loosely connected
**Members:** 26 nodes

## Members
- [[Account and persistence checklist complete]] - rationale - todo
- [[Backend Notes]] - document - docs/technical/backend.md
- [[Backend storage checklist complete]] - rationale - todo
- [[Bearer session progress sync contract]] - rationale - docs/technical/backend.md
- [[Expo React Native architecture]] - rationale - docs/technical/implementation-plan.md
- [[Expo Router route structure]] - rationale - docs/technical/implementation-plan.md
- [[Future language-ready content model]] - rationale - docs/technical/implementation-plan.md
- [[Input limits and sanitization]] - rationale - docs/technical/backend.md
- [[Kavi ki Vidya Todo]] - document - todo
- [[Local dev server API contract]] - rationale - docs/technical/backend.md
- [[OpenAI and voice checklist pending full session test]] - rationale - todo
- [[OpenAI keys stay server-side]] - rationale - docs/technical/backend.md
- [[OpenAI voice provider decision]] - rationale - docs/technical/implementation-plan.md
- [[Release preparation pending internal testing and privacy copy]] - rationale - todo
- [[RootLayout()]] - code - app/_layout.tsx
- [[Supabase progress storage adapter]] - rationale - docs/technical/backend.md
- [[Supabase-backed progress persistence]] - rationale - docs/technical/implementation-plan.md
- [[Technical Implementation Plan]] - document - docs/technical/implementation-plan.md
- [[Voice text and feedback routes]] - rationale - docs/technical/backend.md
- [[_layout.tsx]] - code - app/_layout.tsx
- [[createFileProgressRepository()]] - code - server/progress-store.js
- [[createProgressRepository()]] - code - server/progress-store.js
- [[createSupabaseProgressRepository()]] - code - server/progress-store.js
- [[fs_1]] - code - server/progress-store.js
- [[path_1]] - code - server/progress-store.js
- [[progress-store.js]] - code - server/progress-store.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Technical_Architecture_Docs
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Dev Server API]]
- 2 edges to [[_COMMUNITY_Speak Conversation UI]]
- 2 edges to [[_COMMUNITY_Auth Progress Docs]]
- 2 edges to [[_COMMUNITY_Voice Turn Pipeline]]
- 1 edge to [[_COMMUNITY_Lesson Runtime]]
- 1 edge to [[_COMMUNITY_Client Feedback Logic]]
- 1 edge to [[_COMMUNITY_Live Voice Testing]]
- 1 edge to [[_COMMUNITY_Route Entry Points]]
- 1 edge to [[_COMMUNITY_Learn Review Screens]]
- 1 edge to [[_COMMUNITY_Payload Validation]]
- 1 edge to [[_COMMUNITY_Progress Sanitization]]
- 1 edge to [[_COMMUNITY_Realtime Session Config]]
- 1 edge to [[_COMMUNITY_Server Feedback Logic]]

## Top bridge nodes
- [[Backend Notes]] - degree 13, connects to 5 communities
- [[Technical Implementation Plan]] - degree 11, connects to 4 communities
- [[Kavi ki Vidya Todo]] - degree 9, connects to 4 communities
- [[createProgressRepository()]] - degree 6, connects to 1 community
- [[progress-store.js]] - degree 6, connects to 1 community