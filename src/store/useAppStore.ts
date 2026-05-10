import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createDevSession, type AuthSession } from "@/src/services/auth/sessionClient";
import {
  getDefaultSyncProfileId,
  getSafeProfileId,
  hasProgressSyncEndpoint,
  pullProgress,
  type AuthProfile,
  type AuthProvider,
  type DrillResult,
  type DrillResultOutcome,
  pushProgress,
  type LessonAttempt,
  type ProgressSnapshot,
  type ReviewQueueItem,
} from "@/src/services/sync/progressSync";
import type { ExplanationPreference } from "@/src/types/content";
import type { SpeakingFeedback } from "@/src/types/speaking";

export type ProgressSyncStatus = "local-only" | "idle" | "pulling" | "pushing" | "synced" | "error";

type AppState = {
  hasHydrated: boolean;
  syncStatus: ProgressSyncStatus;
  syncMessage: string;
  lastSyncAt: string | null;
  isSignedIn: boolean;
  hasCompletedOnboarding: boolean;
  authProfile: AuthProfile | null;
  name: string;
  explanationPreference: ExplanationPreference;
  dailyGoalMinutes: number;
  streakCount: number;
  minutesToday: number;
  dailyProgressDate: string | null;
  lastActiveDate: string | null;
  completedLessons: string[];
  skippedLessons: string[];
  skippedModules: string[];
  lessonAttempts: LessonAttempt[];
  reviewQueue: ReviewQueueItem[];
  drillResults: DrillResult[];
  savedPhrases: string[];
  mistakes: string[];
  feedbackHistory: SpeakingFeedback[];
  signIn: (profile?: Partial<AuthProfile> & { provider?: AuthProvider }) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  setExplanationPreference: (preference: ExplanationPreference) => void;
  setDailyGoalMinutes: (minutes: number) => void;
  completeLesson: (lessonId: string, minutes?: number, attempt?: Omit<LessonAttempt, "lessonId" | "completedAt">) => void;
  skipLesson: (lessonId: string) => void;
  skipModule: (moduleId: string) => void;
  addSpeakingFeedback: (feedback: SpeakingFeedback) => void;
  addDrillResult: (result: Omit<DrillResult, "id" | "practicedAt">) => void;
  completeReviewItem: (itemId: string, outcome?: DrillResultOutcome) => void;
  savePhrase: (phrase: string) => void;
  syncProgress: () => Promise<void>;
  resetPrototype: () => void;
};

export type DailyGoalStatus = {
  date: string;
  minutesToday: number;
  dailyGoalMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  isComplete: boolean;
  statusLabel: string;
  nextStep: string;
};

export type StreakStatusKey = "not-started" | "today-done" | "active-today" | "alive" | "missed";

export type StreakStatus = {
  key: StreakStatusKey;
  streakCount: number;
  isAlive: boolean;
  hasActivityToday: boolean;
  label: string;
  detail: string;
};

type DailyGoalStatusInput = {
  dailyGoalMinutes: number;
  minutesToday: number;
  dailyProgressDate: string | null;
};

type StreakStatusInput = DailyGoalStatusInput & {
  streakCount: number;
  lastActiveDate: string | null;
};

const STORAGE_KEY = "kavi-ki-vidya-prototype";

const initialState: ProgressSnapshot = {
  isSignedIn: false,
  hasCompletedOnboarding: false,
  authProfile: null,
  name: "Kavita",
  explanationPreference: "both" as ExplanationPreference,
  dailyGoalMinutes: 5,
  streakCount: 0,
  minutesToday: 0,
  dailyProgressDate: null,
  lastActiveDate: null,
  completedLessons: [],
  skippedLessons: [],
  skippedModules: [],
  lessonAttempts: [],
  reviewQueue: [],
  drillResults: [],
  savedPhrases: ["Nice to meet you.", "I need help."],
  mistakes: ["Use 'My name is...' instead of 'Name my...'"],
  feedbackHistory: [],
};

function pickProgressSnapshot(state: AppState): ProgressSnapshot {
  return {
    isSignedIn: state.isSignedIn,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    authProfile: state.authProfile,
    name: state.name,
    explanationPreference: state.explanationPreference,
    dailyGoalMinutes: state.dailyGoalMinutes,
    streakCount: state.streakCount,
    minutesToday: state.minutesToday,
    dailyProgressDate: state.dailyProgressDate,
    lastActiveDate: state.lastActiveDate,
    completedLessons: state.completedLessons,
    skippedLessons: state.skippedLessons,
    skippedModules: state.skippedModules,
    lessonAttempts: state.lessonAttempts,
    reviewQueue: state.reviewQueue,
    drillResults: state.drillResults,
    savedPhrases: state.savedPhrases,
    mistakes: state.mistakes,
    feedbackHistory: state.feedbackHistory,
  };
}

function uniqueStrings(...groups: Array<readonly string[] | undefined>) {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

function uniqueFeedback(...groups: Array<readonly SpeakingFeedback[] | undefined>) {
  const seen = new Set<string>();
  const merged: SpeakingFeedback[] = [];

  groups.flatMap((group) => group ?? []).forEach((feedback) => {
    const key = JSON.stringify(feedback);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(feedback);
  });

  return merged.slice(0, 10);
}

function uniqueLessonAttempts(...groups: Array<readonly LessonAttempt[] | undefined>) {
  const seen = new Set<string>();
  const merged: LessonAttempt[] = [];

  groups.flatMap((group) => group ?? []).forEach((attempt) => {
    const key = `${attempt.lessonId}-${attempt.completedAt}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(attempt);
  });

  return merged.sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 40);
}

function uniqueReviewItems(...groups: Array<readonly ReviewQueueItem[] | undefined>) {
  const seen = new Set<string>();
  const merged: ReviewQueueItem[] = [];

  groups.flatMap((group) => group ?? []).forEach((item) => {
    const key = item.id || `${item.source}-${item.prompt}-${item.createdAt}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged
    .sort((a, b) => {
      const dueComparison = (a.dueAt ?? a.createdAt).localeCompare(b.dueAt ?? b.createdAt);
      return dueComparison || b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 80);
}

function uniqueDrillResults(...groups: Array<readonly DrillResult[] | undefined>) {
  const seen = new Set<string>();
  const merged: DrillResult[] = [];

  groups.flatMap((group) => group ?? []).forEach((result) => {
    const key = result.id || `${result.itemId}-${result.target}-${result.practicedAt}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(result);
  });

  return merged.sort((a, b) => b.practicedAt.localeCompare(a.practicedAt)).slice(0, 80);
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getPreviousLocalDateKey(dateKey = getLocalDateKey()) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return getLocalDateKey(new Date(year, month - 1, day - 1));
}

function getTodayMinutes(minutes: number, progressDate: string | null) {
  return progressDate === getLocalDateKey() ? minutes : 0;
}

function getFutureIsoDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function getReviewSchedule(score: number) {
  if (score >= 90) return { dueAt: getFutureIsoDate(3), priority: "low" as const, detail: "Review in a few days to keep it fresh." };
  if (score >= 75) return { dueAt: getFutureIsoDate(1), priority: "normal" as const, detail: "Repeat once tomorrow to make it natural." };
  return { dueAt: new Date().toISOString(), priority: "high" as const, detail: "Try this again slowly before tomorrow." };
}

export function getDailyGoalStatus(
  state: DailyGoalStatusInput,
  today = getLocalDateKey(),
): DailyGoalStatus {
  const dailyGoalMinutes = Math.max(1, state.dailyGoalMinutes);
  const minutesToday = state.dailyProgressDate === today ? Math.max(0, state.minutesToday) : 0;
  const remainingMinutes = Math.max(0, dailyGoalMinutes - minutesToday);
  const progressPercent = Math.min(100, Math.round((minutesToday / dailyGoalMinutes) * 100));
  const isComplete = remainingMinutes === 0;

  return {
    date: today,
    minutesToday,
    dailyGoalMinutes,
    remainingMinutes,
    progressPercent,
    isComplete,
    statusLabel: isComplete ? "Goal met" : `${remainingMinutes} min to go`,
    nextStep: isComplete ? "Review saved phrases or keep practicing." : "Finish a lesson or speaking practice to close today.",
  };
}

export function getStreakStatus(
  state: StreakStatusInput,
  today = getLocalDateKey(),
): StreakStatus {
  const goalStatus = getDailyGoalStatus(state, today);
  const yesterday = getPreviousLocalDateKey(today);
  const hasActivityToday = state.lastActiveDate === today || state.dailyProgressDate === today;

  if (goalStatus.isComplete) {
    return {
      key: "today-done",
      streakCount: Math.max(1, state.streakCount),
      isAlive: true,
      hasActivityToday: true,
      label: "Today done",
      detail: "Your streak is safe for today.",
    };
  }

  if (hasActivityToday) {
    return {
      key: "active-today",
      streakCount: Math.max(1, state.streakCount),
      isAlive: true,
      hasActivityToday: true,
      label: "In progress",
      detail: `${goalStatus.remainingMinutes} min left to finish today's goal.`,
    };
  }

  if (!state.lastActiveDate) {
    return {
      key: "not-started",
      streakCount: 0,
      isAlive: false,
      hasActivityToday: false,
      label: "Start a streak",
      detail: "Practice today to begin.",
    };
  }

  if (state.lastActiveDate === yesterday) {
    return {
      key: "alive",
      streakCount: state.streakCount,
      isAlive: true,
      hasActivityToday: false,
      label: "Streak alive",
      detail: "Practice today to keep it going.",
    };
  }

  return {
    key: "missed",
    streakCount: 0,
    isAlive: false,
    hasActivityToday: false,
    label: "Missed day",
    detail: "Start again with one small practice.",
  };
}

function applyDailyActivity(state: AppState, minutes: number) {
  const today = getLocalDateKey();
  const minutesForToday = state.dailyProgressDate === today ? state.minutesToday : 0;
  const streakCount =
    state.lastActiveDate === today
      ? state.streakCount
      : state.lastActiveDate === getPreviousLocalDateKey(today)
        ? state.streakCount + 1
        : 1;

  return {
    dailyProgressDate: today,
    lastActiveDate: today,
    minutesToday: Math.min(state.dailyGoalMinutes, minutesForToday + minutes),
    streakCount,
  };
}

function normalizeProgressSnapshot(state: Partial<ProgressSnapshot>): ProgressSnapshot {
  const today = getLocalDateKey();
  const hasLegacyProgress = typeof state.minutesToday === "number" && state.minutesToday > 0;
  const hasLegacyStreak = typeof state.streakCount === "number" && state.streakCount > 0;
  const dailyProgressDate = state.dailyProgressDate ?? (hasLegacyProgress ? today : null);
  const lastActiveDate = state.lastActiveDate ?? (hasLegacyStreak ? today : null);

  return {
    ...initialState,
    ...state,
    authProfile: normalizeAuthProfile(state.authProfile),
    dailyProgressDate,
    lastActiveDate,
    minutesToday: getTodayMinutes(state.minutesToday ?? initialState.minutesToday, dailyProgressDate),
    completedLessons: Array.isArray(state.completedLessons) ? state.completedLessons : initialState.completedLessons,
    skippedLessons: Array.isArray(state.skippedLessons) ? state.skippedLessons : initialState.skippedLessons,
    skippedModules: Array.isArray(state.skippedModules) ? state.skippedModules : initialState.skippedModules,
    lessonAttempts: Array.isArray(state.lessonAttempts) ? state.lessonAttempts : initialState.lessonAttempts,
    reviewQueue: Array.isArray(state.reviewQueue) ? state.reviewQueue : initialState.reviewQueue,
    drillResults: Array.isArray(state.drillResults) ? state.drillResults : initialState.drillResults,
    savedPhrases: Array.isArray(state.savedPhrases) ? state.savedPhrases : initialState.savedPhrases,
    mistakes: Array.isArray(state.mistakes) ? state.mistakes : initialState.mistakes,
    feedbackHistory: Array.isArray(state.feedbackHistory) ? state.feedbackHistory : initialState.feedbackHistory,
  };
}

function mergeProgressSnapshots(local: ProgressSnapshot, remote: Partial<ProgressSnapshot>): ProgressSnapshot {
  const normalizedRemote = normalizeProgressSnapshot(remote);
  const remoteHasTodayProgress = normalizedRemote.dailyProgressDate === getLocalDateKey();
  const localHasTodayProgress = local.dailyProgressDate === getLocalDateKey();

  return {
    ...local,
    isSignedIn: local.isSignedIn || normalizedRemote.isSignedIn,
    hasCompletedOnboarding: local.hasCompletedOnboarding || normalizedRemote.hasCompletedOnboarding,
    authProfile: local.authProfile ?? normalizedRemote.authProfile,
    name: local.name === initialState.name ? normalizedRemote.name : local.name,
    explanationPreference:
      local.explanationPreference === initialState.explanationPreference
        ? normalizedRemote.explanationPreference
        : local.explanationPreference,
    dailyGoalMinutes:
      local.dailyGoalMinutes === initialState.dailyGoalMinutes ? normalizedRemote.dailyGoalMinutes : local.dailyGoalMinutes,
    streakCount: Math.max(local.streakCount, normalizedRemote.streakCount),
    minutesToday: remoteHasTodayProgress && localHasTodayProgress
      ? Math.max(local.minutesToday, normalizedRemote.minutesToday)
      : localHasTodayProgress
        ? local.minutesToday
        : normalizedRemote.minutesToday,
    dailyProgressDate: localHasTodayProgress ? local.dailyProgressDate : normalizedRemote.dailyProgressDate,
    lastActiveDate: [local.lastActiveDate, normalizedRemote.lastActiveDate].filter(Boolean).sort().at(-1) ?? null,
    completedLessons: uniqueStrings(local.completedLessons, normalizedRemote.completedLessons),
    skippedLessons: uniqueStrings(local.skippedLessons, normalizedRemote.skippedLessons),
    skippedModules: uniqueStrings(local.skippedModules, normalizedRemote.skippedModules),
    lessonAttempts: uniqueLessonAttempts(local.lessonAttempts, normalizedRemote.lessonAttempts),
    reviewQueue: uniqueReviewItems(local.reviewQueue, normalizedRemote.reviewQueue),
    drillResults: uniqueDrillResults(local.drillResults, normalizedRemote.drillResults),
    savedPhrases: uniqueStrings(local.savedPhrases, normalizedRemote.savedPhrases),
    mistakes: uniqueStrings(local.mistakes, normalizedRemote.mistakes),
    feedbackHistory: uniqueFeedback(local.feedbackHistory, normalizedRemote.feedbackHistory),
  };
}

function getSyncUnavailableMessage() {
  return "Progress sync is local-only until the practice API is configured.";
}

function getCurrentSyncProfileId() {
  return getSafeProfileId(useAppStore.getState().authProfile?.syncProfileId ?? getDefaultSyncProfileId());
}

function getSafeSyncIdForProvider(provider: AuthProvider, providerUserId: string) {
  return getDefaultSyncProfileId();
}

function createAuthProfile(profile?: Partial<AuthProfile> & { provider?: AuthProvider }): AuthProfile {
  const provider: AuthProvider = "local";
  const providerUserId =
    profile?.providerUserId?.trim() ||
    "kavita-local";
  const syncProfileId = getSafeProfileId(profile?.syncProfileId || getSafeSyncIdForProvider(provider, providerUserId));
  const displayName = profile?.displayName?.trim() || "Kavita";
  const email = profile?.email?.trim();

  return {
    provider,
    providerUserId,
    syncProfileId,
    displayName,
    email: email || undefined,
    signedInAt: profile?.signedInAt ?? new Date().toISOString(),
  };
}

function normalizeAuthProfile(value: unknown): AuthProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const profile = value as Partial<AuthProfile>;
  const provider: AuthProvider = "local";
  const providerUserId = typeof profile.providerUserId === "string" ? profile.providerUserId : undefined;
  const syncProfileId = typeof profile.syncProfileId === "string" ? profile.syncProfileId : undefined;
  const displayName = typeof profile.displayName === "string" ? profile.displayName : undefined;
  const email = typeof profile.email === "string" ? profile.email : undefined;
  const signedInAt = typeof profile.signedInAt === "string" ? profile.signedInAt : undefined;

  return createAuthProfile({ provider, providerUserId, syncProfileId, displayName, email, signedInAt });
}

let lastSerializedSnapshot = "";
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let suppressNextPush = false;
let activeAuthSession: AuthSession | null = null;
let pendingAuthSession: Promise<AuthSession> | null = null;

function clearAuthSession() {
  activeAuthSession = null;
  pendingAuthSession = null;
}

async function ensureAuthSession(authProfile: AuthProfile | null) {
  if (!authProfile || !hasProgressSyncEndpoint()) return null;

  if (activeAuthSession?.profileId === authProfile.syncProfileId && activeAuthSession.provider === authProfile.provider) {
    return activeAuthSession;
  }

  if (!pendingAuthSession) {
    pendingAuthSession = createDevSession(authProfile)
      .then((session) => {
        activeAuthSession = session;
        return session;
      })
      .finally(() => {
        pendingAuthSession = null;
      });
  }

  return pendingAuthSession;
}

async function pushCurrentProgress(snapshot: ProgressSnapshot) {
  if (!hasProgressSyncEndpoint()) {
    useAppStore.setState({
      syncStatus: "local-only",
      syncMessage: getSyncUnavailableMessage(),
      lastSyncAt: null,
    });
    return;
  }

  try {
    const session = await ensureAuthSession(snapshot.authProfile);
    const profileId = session?.profileId ?? getCurrentSyncProfileId();
    useAppStore.setState({ syncStatus: "pushing", syncMessage: `Saving progress for ${profileId}...` });
    const record = await pushProgress(snapshot, { profileId, sessionToken: session?.token });
    useAppStore.setState({
      syncStatus: "synced",
      syncMessage: "Progress saved.",
      lastSyncAt: record.updatedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    useAppStore.setState({
      syncStatus: "error",
      syncMessage: error instanceof Error ? error.message : "Progress sync failed.",
    });
  }
}

function scheduleProgressPush(snapshot: ProgressSnapshot) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCurrentProgress(snapshot);
  }, 650);
}

async function syncProgressNow() {
  if (!hasProgressSyncEndpoint()) {
    useAppStore.setState({
      syncStatus: "local-only",
      syncMessage: getSyncUnavailableMessage(),
      lastSyncAt: null,
    });
    return;
  }

  try {
    const authProfile = useAppStore.getState().authProfile;
    const session = await ensureAuthSession(authProfile);
    const profileId = session?.profileId ?? getCurrentSyncProfileId();
    useAppStore.setState({ syncStatus: "pulling", syncMessage: `Checking saved progress for ${profileId}...` });
    const record = await pullProgress(profileId, { sessionToken: session?.token });
    const merged = mergeProgressSnapshots(pickProgressSnapshot(useAppStore.getState()), record.progress);
    suppressNextPush = true;
    useAppStore.setState({
      ...merged,
      syncStatus: "synced",
      syncMessage: record.revision > 0 ? "Progress is up to date." : "Ready to save progress.",
      lastSyncAt: record.updatedAt,
    });
    await pushCurrentProgress(merged);
  } catch (error) {
    useAppStore.setState({
      syncStatus: "error",
      syncMessage: error instanceof Error ? error.message : "Progress sync failed.",
    });
  }
}

export const useAppStore = create<AppState>()((set) => ({
  hasHydrated: false,
  syncStatus: hasProgressSyncEndpoint() ? "idle" : "local-only",
  syncMessage: hasProgressSyncEndpoint() ? "Progress sync is ready." : getSyncUnavailableMessage(),
  lastSyncAt: null,
  ...initialState,
  signIn: (profile) => {
    const authProfile = createAuthProfile(profile);
    clearAuthSession();
    set({ isSignedIn: true, authProfile, name: authProfile.displayName || "Kavita" });
    void syncProgressNow();
  },
  signOut: () => {
    clearAuthSession();
    suppressNextPush = true;
    set({
      isSignedIn: false,
      authProfile: null,
      syncStatus: hasProgressSyncEndpoint() ? "idle" : "local-only",
      syncMessage: "Signed out locally. Progress remains on this device.",
    });
  },
  completeOnboarding: () =>
    set((state) => ({
      hasCompletedOnboarding: true,
      isSignedIn: true,
      authProfile: state.authProfile ?? createAuthProfile(),
    })),
  setExplanationPreference: (explanationPreference) => set({ explanationPreference }),
  setDailyGoalMinutes: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
  completeLesson: (lessonId, minutes = 4, attempt) =>
    set((state) => {
      const completedAt = new Date().toISOString();
      const lessonAttempt: LessonAttempt | undefined = attempt
        ? {
            lessonId,
            completedAt,
            score: Math.max(0, Math.min(100, Math.round(attempt.score))),
            correctCount: Math.max(0, attempt.correctCount),
            checkedCount: Math.max(0, attempt.checkedCount),
            retryCount: Math.max(0, attempt.retryCount),
            reviewPrompts: attempt.reviewPrompts.slice(0, 6),
          }
        : undefined;
      const reviewSchedule = lessonAttempt ? getReviewSchedule(lessonAttempt.score) : undefined;
      const reviewItems: ReviewQueueItem[] = lessonAttempt
        ? lessonAttempt.reviewPrompts.map((prompt, index) => ({
            id: `${lessonId}-${completedAt}-${index}`,
            source: "lesson",
            title: "Lesson review",
            prompt,
            detail: reviewSchedule?.detail ?? "Repeat once to keep it fresh.",
            createdAt: completedAt,
            completedAt: null,
            dueAt: reviewSchedule?.dueAt ?? completedAt,
            priority: reviewSchedule?.priority ?? "normal",
          }))
        : [];

      return {
        completedLessons: state.completedLessons.includes(lessonId)
          ? state.completedLessons
          : [...state.completedLessons, lessonId],
        lessonAttempts: lessonAttempt ? [lessonAttempt, ...state.lessonAttempts].slice(0, 40) : state.lessonAttempts,
        reviewQueue: uniqueReviewItems(reviewItems, state.reviewQueue),
        ...applyDailyActivity(state, minutes),
      };
    }),
  skipLesson: (lessonId) =>
    set((state) => ({
      skippedLessons: state.skippedLessons.includes(lessonId) ? state.skippedLessons : [...state.skippedLessons, lessonId],
    })),
  skipModule: (moduleId) =>
    set((state) => ({
      skippedModules: state.skippedModules.includes(moduleId) ? state.skippedModules : [...state.skippedModules, moduleId],
    })),
  addSpeakingFeedback: (feedback) =>
    set((state) => {
      const createdAt = new Date().toISOString();
      const speakingReviewItems: ReviewQueueItem[] = [
        ...feedback.pronunciation.retryWords.map((word, index) => ({
          id: `speaking-pronunciation-${createdAt}-${index}`,
          source: "speaking" as const,
          title: "Pronunciation practice",
          prompt: word,
          detail: feedback.pronunciation.tips?.[index] ?? "Say it slowly once, then naturally.",
          createdAt,
          completedAt: null,
          dueAt: createdAt,
          priority: "high" as const,
        })),
        ...feedback.mistakes.slice(0, 3).map((mistake, index) => ({
          id: `speaking-mistake-${createdAt}-${index}`,
          source: "speaking" as const,
          title: "Speaking correction",
          prompt: mistake,
          detail: "Practice the improved version in free chat.",
          createdAt,
          completedAt: null,
          dueAt: getFutureIsoDate(1),
          priority: "normal" as const,
        })),
      ];

      return {
        feedbackHistory: [feedback, ...state.feedbackHistory].slice(0, 10),
        reviewQueue: uniqueReviewItems(speakingReviewItems, state.reviewQueue),
        savedPhrases: Array.from(new Set([...feedback.savedPhrases, ...state.savedPhrases])),
        mistakes: Array.from(new Set([...feedback.mistakes, ...state.mistakes])),
        ...applyDailyActivity(state, 3),
      };
    }),
  addDrillResult: (result) =>
    set((state) => {
      const practicedAt = new Date().toISOString();
      const drillResult: DrillResult = {
        ...result,
        id: `drill-${practicedAt}-${Math.random().toString(36).slice(2)}`,
        practicedAt,
        score: typeof result.score === "number" ? Math.max(0, Math.min(100, Math.round(result.score))) : undefined,
        tips: result.tips.slice(0, 4),
      };

      return {
        drillResults: [drillResult, ...state.drillResults].slice(0, 80),
        reviewQueue: drillResult.itemId
          ? state.reviewQueue.map((item) => {
              if (item.id !== drillResult.itemId) return item;

              return {
                ...item,
                practiceCount: (item.practiceCount ?? 0) + 1,
                lastPracticedAt: practicedAt,
                lastResult: drillResult.outcome,
                dueAt: drillResult.outcome === "needs-retry" ? getFutureIsoDate(1) : item.dueAt,
                completedAt:
                  drillResult.outcome === "needs-retry" ? item.completedAt : item.completedAt ?? practicedAt,
              };
            })
          : state.reviewQueue,
      };
    }),
  completeReviewItem: (itemId, outcome = "practiced") =>
    set((state) => {
      const practicedAt = new Date().toISOString();
      return {
        reviewQueue: state.reviewQueue.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completedAt: outcome === "needs-retry" ? item.completedAt : item.completedAt ?? practicedAt,
                lastPracticedAt: practicedAt,
                lastResult: outcome,
                practiceCount: (item.practiceCount ?? 0) + 1,
                dueAt: outcome === "needs-retry" ? getFutureIsoDate(1) : item.dueAt,
              }
            : item,
        ),
      };
    }),
  savePhrase: (phrase) =>
    set((state) => ({
      savedPhrases: state.savedPhrases.includes(phrase) ? state.savedPhrases : [phrase, ...state.savedPhrases],
    })),
  syncProgress: syncProgressNow,
  resetPrototype: () => set(initialState),
}));

AsyncStorage.getItem(STORAGE_KEY)
  .then((value) => {
    if (!value) {
      lastSerializedSnapshot = JSON.stringify(initialState);
      useAppStore.setState({ hasHydrated: true });
      void syncProgressNow();
      return;
    }
    const storedSnapshot = normalizeProgressSnapshot(JSON.parse(value));
    lastSerializedSnapshot = JSON.stringify(storedSnapshot);
    useAppStore.setState({ ...storedSnapshot, hasHydrated: true });
    void syncProgressNow();
  })
  .catch(() => {
    lastSerializedSnapshot = JSON.stringify(initialState);
    useAppStore.setState({ hasHydrated: true });
    void syncProgressNow();
  });

useAppStore.subscribe((state) => {
  const snapshot = pickProgressSnapshot(state);
  const serializedSnapshot = JSON.stringify(snapshot);
  if (serializedSnapshot === lastSerializedSnapshot) return;

  lastSerializedSnapshot = serializedSnapshot;
  AsyncStorage.setItem(STORAGE_KEY, serializedSnapshot).catch(() => undefined);

  if (!state.hasHydrated) return;
  if (suppressNextPush) {
    suppressNextPush = false;
    return;
  }

  scheduleProgressPush(snapshot);
});
