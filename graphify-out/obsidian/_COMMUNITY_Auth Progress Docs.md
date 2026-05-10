---
type: community
cohesion: 0.06
members: 67
---

# Auth Progress Docs

**Cohesion:** 0.06 - loosely connected
**Members:** 67 nodes

## Members
- [[Account And Persistence]] - document - docs/technical/account-and-persistence.md
- [[AppState]] - code - src/store/useAppStore.ts
- [[AuthProfile]] - code - src/services/sync/progressSync.ts
- [[AuthProvider]] - code - src/services/sync/progressSync.ts
- [[AuthSession]] - code - src/services/auth/sessionClient.ts
- [[DailyGoalStatus]] - code - src/store/useAppStore.ts
- [[DailyGoalStatusInput]] - code - src/store/useAppStore.ts
- [[DrillResult]] - code - src/services/sync/progressSync.ts
- [[DrillResultOutcome]] - code - src/services/sync/progressSync.ts
- [[LearnHome()]] - code - app/(tabs)/learn/index.tsx
- [[LessonAttempt]] - code - src/services/sync/progressSync.ts
- [[Local learner profile account model]] - rationale - docs/technical/account-and-persistence.md
- [[No external OAuth current scope]] - rationale - docs/technical/account-and-persistence.md
- [[ProgressSnapshot]] - code - src/services/sync/progressSync.ts
- [[ProgressSyncRecord]] - code - src/services/sync/progressSync.ts
- [[ProgressSyncStatus]] - code - src/store/useAppStore.ts
- [[PullProgressOptions]] - code - src/services/sync/progressSync.ts
- [[PushProgressOptions]] - code - src/services/sync/progressSync.ts
- [[ReviewQueueItem]] - code - src/services/sync/progressSync.ts
- [[StreakStatusInput]] - code - src/store/useAppStore.ts
- [[StreakStatusKey]] - code - src/store/useAppStore.ts
- [[Supabase learner progress persistence]] - rationale - docs/technical/account-and-persistence.md
- [[applyDailyActivity()]] - code - src/store/useAppStore.ts
- [[clearAuthSession()]] - code - src/store/useAppStore.ts
- [[createAuthProfile()]] - code - src/store/useAppStore.ts
- [[createDevSession()]] - code - src/services/auth/sessionClient.ts
- [[ensureAuthSession()]] - code - src/store/useAppStore.ts
- [[formatActivityDate()]] - code - app/(tabs)/profile/index.tsx
- [[getAuthEndpoint()]] - code - src/services/auth/sessionClient.ts
- [[getConfiguredApiBaseUrl()]] - code - src/services/sync/progressSync.ts
- [[getCurrentSession()]] - code - src/services/auth/sessionClient.ts
- [[getCurrentSyncProfileId()]] - code - src/store/useAppStore.ts
- [[getDefaultSyncProfileId()]] - code - src/services/sync/progressSync.ts
- [[getErrorMessage()_1]] - code - src/services/sync/progressSync.ts
- [[getFutureIsoDate()]] - code - src/store/useAppStore.ts
- [[getLocalDateKey()]] - code - src/store/useAppStore.ts
- [[getPreviousLocalDateKey()]] - code - src/store/useAppStore.ts
- [[getProgressEndpoint()]] - code - src/services/sync/progressSync.ts
- [[getReviewSchedule()]] - code - src/store/useAppStore.ts
- [[getSafeProfileId()]] - code - src/services/sync/progressSync.ts
- [[getSafeSyncIdForProvider()]] - code - src/store/useAppStore.ts
- [[getSessionHeaders()]] - code - src/services/sync/progressSync.ts
- [[getSyncUnavailableMessage()]] - code - src/store/useAppStore.ts
- [[getTodayMinutes()]] - code - src/store/useAppStore.ts
- [[hasProgressSyncEndpoint()]] - code - src/services/sync/progressSync.ts
- [[initialState]] - code - src/store/useAppStore.ts
- [[mergeProgressSnapshots()]] - code - src/store/useAppStore.ts
- [[normalizeAuthProfile()]] - code - src/store/useAppStore.ts
- [[normalizeProgressSnapshot()]] - code - src/store/useAppStore.ts
- [[pickProgressSnapshot()]] - code - src/store/useAppStore.ts
- [[progressSync.ts]] - code - src/services/sync/progressSync.ts
- [[pullProgress()]] - code - src/services/sync/progressSync.ts
- [[pushCurrentProgress()]] - code - src/store/useAppStore.ts
- [[pushProgress()]] - code - src/services/sync/progressSync.ts
- [[scheduleProgressPush()]] - code - src/store/useAppStore.ts
- [[serializedSnapshot]] - code - src/store/useAppStore.ts
- [[sessionClient.ts]] - code - src/services/auth/sessionClient.ts
- [[snapshot]] - code - src/store/useAppStore.ts
- [[storedSnapshot]] - code - src/store/useAppStore.ts
- [[syncProgressNow()]] - code - src/store/useAppStore.ts
- [[trimTrailingSlash()]] - code - src/services/sync/progressSync.ts
- [[uniqueDrillResults()]] - code - src/store/useAppStore.ts
- [[uniqueFeedback()]] - code - src/store/useAppStore.ts
- [[uniqueLessonAttempts()]] - code - src/store/useAppStore.ts
- [[uniqueReviewItems()]] - code - src/store/useAppStore.ts
- [[uniqueStrings()]] - code - src/store/useAppStore.ts
- [[useAppStore.ts]] - code - src/store/useAppStore.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Progress_Docs
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Learn Review Screens]]
- 7 edges to [[_COMMUNITY_Speak Conversation UI]]
- 5 edges to [[_COMMUNITY_Meaning Content Model]]
- 5 edges to [[_COMMUNITY_Route Entry Points]]
- 2 edges to [[_COMMUNITY_Technical Architecture Docs]]
- 2 edges to [[_COMMUNITY_Onboarding Speak Shell]]
- 1 edge to [[_COMMUNITY_Learning Path Controls]]
- 1 edge to [[_COMMUNITY_Lesson Runtime]]
- 1 edge to [[_COMMUNITY_Client Feedback Logic]]
- 1 edge to [[_COMMUNITY_Product Requirements]]

## Top bridge nodes
- [[useAppStore.ts]] - degree 70, connects to 8 communities
- [[progressSync.ts]] - degree 29, connects to 3 communities
- [[Account And Persistence]] - degree 8, connects to 3 communities
- [[LearnHome()]] - degree 4, connects to 3 communities
- [[getLocalDateKey()]] - degree 10, connects to 1 community