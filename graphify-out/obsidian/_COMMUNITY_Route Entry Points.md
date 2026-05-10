---
type: community
cohesion: 0.22
members: 11
---

# Route Entry Points

**Cohesion:** 0.22 - loosely connected
**Members:** 11 nodes

## Members
- [[ConversationScreen()]] - code - app/(tabs)/speak/conversation.tsx
- [[DailyGoalScreen()]] - code - app/onboarding/daily-goal.tsx
- [[Index()]] - code - app/index.tsx
- [[LessonScreen()]] - code - app/(tabs)/learn/lesson/[lessonId].tsx
- [[ModuleDetail()]] - code - app/(tabs)/learn/module/[moduleId].tsx
- [[daily-goal.tsx]] - code - app/onboarding/daily-goal.tsx
- [[goals]] - code - app/onboarding/daily-goal.tsx
- [[index.tsx]] - code - app/index.tsx
- [[styles_12]] - code - app/index.tsx
- [[styles_25]] - code - app/onboarding/daily-goal.tsx
- [[useAppStore]] - code - src/store/useAppStore.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Route_Entry_Points
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Learn Review Screens]]
- 5 edges to [[_COMMUNITY_Auth Progress Docs]]
- 4 edges to [[_COMMUNITY_Learning Path Controls]]
- 4 edges to [[_COMMUNITY_Onboarding Speak Shell]]
- 4 edges to [[_COMMUNITY_Speak Conversation UI]]
- 2 edges to [[_COMMUNITY_Lesson Runtime]]
- 2 edges to [[_COMMUNITY_Client Feedback Logic]]
- 2 edges to [[_COMMUNITY_Meaning Content Model]]
- 2 edges to [[_COMMUNITY_Product Requirements]]
- 1 edge to [[_COMMUNITY_Technical Architecture Docs]]
- 1 edge to [[_COMMUNITY_Live Voice Testing]]

## Top bridge nodes
- [[useAppStore]] - degree 25, connects to 9 communities
- [[daily-goal.tsx]] - degree 11, connects to 5 communities
- [[ConversationScreen()]] - degree 5, connects to 4 communities
- [[index.tsx]] - degree 5, connects to 2 communities
- [[LessonScreen()]] - degree 2, connects to 1 community