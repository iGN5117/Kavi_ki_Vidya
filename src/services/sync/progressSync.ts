import type { ExplanationPreference } from "@/src/types/content";
import type { SpeakingFeedback } from "@/src/types/speaking";

export type LessonAttempt = {
  lessonId: string;
  completedAt: string;
  score: number;
  correctCount: number;
  checkedCount: number;
  retryCount: number;
  reviewPrompts: string[];
};

export type ReviewQueueItem = {
  id: string;
  source: "lesson" | "speaking";
  title: string;
  prompt: string;
  detail: string;
  createdAt: string;
  completedAt: string | null;
  dueAt?: string | null;
  priority?: "low" | "normal" | "high";
  practiceCount?: number;
  lastPracticedAt?: string | null;
  lastResult?: DrillResultOutcome;
};

export type DrillResultOutcome = "improved" | "practiced" | "needs-retry";

export type DrillResult = {
  id: string;
  itemId?: string;
  source: "lesson" | "speaking";
  target: string;
  practicedAt: string;
  outcome: DrillResultOutcome;
  attempted: boolean;
  learnerTurnCount: number;
  score?: number;
  summary: string;
  tips: string[];
};

export type AuthProvider = "local";

export type AuthProfile = {
  provider: AuthProvider;
  providerUserId: string;
  syncProfileId: string;
  displayName: string;
  email?: string;
  signedInAt: string;
};

export type ProgressSnapshot = {
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
};

export type ProgressSyncRecord = {
  profileId: string;
  progress: ProgressSnapshot;
  updatedAt: string | null;
  revision: number;
  ownerUserId?: string | null;
  authProvider?: AuthProvider | string | null;
  source?: "local-dev-storage" | string;
};

export type PushProgressOptions = {
  profileId?: string;
  sessionToken?: string;
};

export type PullProgressOptions = {
  sessionToken?: string;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const realtimeSessionEndpoint = process.env.EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT;
const configuredProfileId = process.env.EXPO_PUBLIC_SYNC_PROFILE_ID;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getConfiguredApiBaseUrl() {
  if (apiBaseUrl) return trimTrailingSlash(apiBaseUrl);

  const realtimeEndpoint = realtimeSessionEndpoint ? trimTrailingSlash(realtimeSessionEndpoint) : undefined;
  if (!realtimeEndpoint) return undefined;

  if (realtimeEndpoint.endsWith("/api/realtime/session")) {
    return realtimeEndpoint.slice(0, -"/realtime/session".length);
  }

  return realtimeEndpoint.replace(/\/realtime\/session$/, "");
}

export function getSafeProfileId(value?: string) {
  const fallback = "local-kavita";
  if (!value) return fallback;

  const trimmed = value.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(trimmed) ? trimmed : fallback;
}

function getProgressEndpoint(profileId = getDefaultSyncProfileId()) {
  const baseUrl = getConfiguredApiBaseUrl();
  if (!baseUrl) return undefined;

  return `${baseUrl}/progress/${encodeURIComponent(getSafeProfileId(profileId))}`;
}

export async function getErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; detail?: string };
    return [payload.error, payload.detail].filter(Boolean).join(" ") || fallback;
  } catch {
    return fallback;
  }
}

export function getDefaultSyncProfileId() {
  return getSafeProfileId(configuredProfileId);
}

export function hasProgressSyncEndpoint() {
  return Boolean(getConfiguredApiBaseUrl());
}

function getSessionHeaders(sessionToken?: string): Record<string, string> {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

export async function pullProgress(profileId = getDefaultSyncProfileId(), options: PullProgressOptions = {}) {
  const progressEndpoint = getProgressEndpoint(profileId);
  if (!progressEndpoint) {
    throw new Error("Progress sync is not configured until EXPO_PUBLIC_API_BASE_URL is set.");
  }

  const response = await fetch(progressEndpoint, {
    headers: getSessionHeaders(options.sessionToken),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Progress pull failed: ${response.status}`));
  }

  return response.json() as Promise<ProgressSyncRecord>;
}

export async function pushProgress(progress: ProgressSnapshot, options: PushProgressOptions = {}) {
  const progressEndpoint = getProgressEndpoint(options.profileId);
  if (!progressEndpoint) {
    throw new Error("Progress sync is not configured until EXPO_PUBLIC_API_BASE_URL is set.");
  }

  const response = await fetch(progressEndpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getSessionHeaders(options.sessionToken),
    },
    body: JSON.stringify({ progress }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Progress push failed: ${response.status}`));
  }

  return response.json() as Promise<ProgressSyncRecord>;
}
