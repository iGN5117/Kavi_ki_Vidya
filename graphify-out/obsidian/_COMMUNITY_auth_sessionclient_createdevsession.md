---
type: community
cohesion: 0.06
members: 64
---

# auth_sessionclient_createdevsession

**Cohesion:** 0.06 - loosely connected
**Members:** 64 nodes

## Members
- [[AppState]] - code - src/store/useAppStore.ts
- [[AuthProvider]] - code - src/services/sync/progressSync.ts
- [[ConversationScreen()]] - code - app/(tabs)/speak/conversation.tsx
- [[DailyGoalScreen()]] - code - app/onboarding/daily-goal.tsx
- [[DailyGoalStatus]] - code - src/store/useAppStore.ts
- [[DailyGoalStatusInput]] - code - src/store/useAppStore.ts
- [[DrillResult]] - code - src/services/sync/progressSync.ts
- [[DrillResultOutcome]] - code - src/services/sync/progressSync.ts
- [[LanguageScreen()]] - code - app/onboarding/language.tsx
- [[LessonAttempt]] - code - src/services/sync/progressSync.ts
- [[LessonScreen()]] - code - app/(tabs)/learn/lesson/[lessonId].tsx
- [[ModuleDetail()]] - code - app/(tabs)/learn/module/[moduleId].tsx
- [[ProgressSnapshot]] - code - src/services/sync/progressSync.ts
- [[ProgressSyncRecord]] - code - src/services/sync/progressSync.ts
- [[ProgressSyncStatus]] - code - src/store/useAppStore.ts
- [[PullProgressOptions]] - code - src/services/sync/progressSync.ts
- [[PushProgressOptions]] - code - src/services/sync/progressSync.ts
- [[ReviewQueueItem]] - code - src/services/sync/progressSync.ts
- [[StreakStatus]] - code - src/store/useAppStore.ts
- [[StreakStatusInput]] - code - src/store/useAppStore.ts
- [[assertExportedSyncHelpers()]] - code - scripts/verify-progress-persistence.js
- [[authProfile]] - code - server/dev-server.js
- [[authSessions]] - code - server/dev-server.js
- [[clearAuthSession()]] - code - src/store/useAppStore.ts
- [[createAuthProfile()]] - code - src/store/useAppStore.ts
- [[createDevSession()]] - code - src/services/auth/sessionClient.ts
- [[ensureAuthSession()]] - code - src/store/useAppStore.ts
- [[getAuthEndpoint()]] - code - src/services/auth/sessionClient.ts
- [[getConfiguredApiBaseUrl()]] - code - src/services/sync/progressSync.ts
- [[getCurrentSession()]] - code - src/services/auth/sessionClient.ts
- [[getCurrentSyncProfileId()]] - code - src/store/useAppStore.ts
- [[getDefaultSyncProfileId()]] - code - src/services/sync/progressSync.ts
- [[getFutureIsoDate()]] - code - src/store/useAppStore.ts
- [[getLocalDateKey()]] - code - src/store/useAppStore.ts
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
TABLE source_file, type FROM #community/auth_sessionclient_createdevsession
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_adaptive_practiceplan_getadaptivelessonrecommendation]]
- 17 edges to [[_COMMUNITY_app_index_styles]]
- 12 edges to [[_COMMUNITY_app_layout_rootlayout]]
- 4 edges to [[_COMMUNITY_adaptive_practiceplan_adaptivelessonrecommendation]]
- 3 edges to [[_COMMUNITY_content_lessonskillprofiles_getlessonskilltags]]
- 2 edges to [[_COMMUNITY_server_dev_server_access]]
- 1 edge to [[_COMMUNITY_scripts_verify_adaptive_review_stringify]]

## Top bridge nodes
- [[progressSync.ts]] - degree 29, connects to 4 communities
- [[useAppStore.ts]] - degree 76, connects to 3 communities
- [[assertExportedSyncHelpers()]] - degree 8, connects to 2 communities
- [[authProfile]] - degree 5, connects to 2 communities
- [[sessionClient.ts]] - degree 10, connects to 1 community