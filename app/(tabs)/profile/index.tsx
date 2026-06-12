import { useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GoalProgress } from "@/src/components/GoalProgress";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import type { AuthProfile } from "@/src/services/sync/progressSync";
import { StreakProgress } from "@/src/components/StreakProgress";
import { getDailyGoalStatus, getLocalDateKey, getPreviousLocalDateKey, getStreakStatus, useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { ExplanationPreference } from "@/src/types/content";

const explanationOptions: Array<{ value: ExplanationPreference; label: string; detail: string }> = [
  { value: "hi-Deva", label: "Hindi", detail: "हिंदी" },
  { value: "hi-Latn", label: "Hinglish", detail: "Roman Hindi" },
  { value: "both", label: "Both", detail: "Hindi + Hinglish" },
];

const goalOptions = [5, 10, 15, 20];

export default function ProfileScreen() {
  const [isResetOpen, setResetOpen] = useState(false);
  const {
    name,
    isSignedIn,
    hasCompletedOnboarding,
    authProfile,
    dailyGoalMinutes,
    explanationPreference,
    streakCount,
    minutesToday,
    dailyProgressDate,
    lastActiveDate,
    completedLessons,
    skippedLessons,
    savedPhrases,
    feedbackHistory,
    syncStatus,
    syncMessage,
    lastSyncAt,
    setExplanationPreference,
    setDailyGoalMinutes,
    signOut,
    syncProgress,
    resetPrototype,
  } = useAppStore();
  const today = getLocalDateKey();
  const goalStatus = getDailyGoalStatus({ dailyGoalMinutes, minutesToday, dailyProgressDate }, today);
  const streakStatus = getStreakStatus({ dailyGoalMinutes, minutesToday, dailyProgressDate, streakCount, lastActiveDate }, today);
  const latestFeedback = feedbackHistory[0];
  const nextAction = getProfileNextAction(goalStatus.isComplete, Boolean(latestFeedback), savedPhrases.length);

  function confirmReset() {
    resetPrototype();
    setResetOpen(false);
    router.replace("/onboarding/sign-in");
  }

  function signOutLocally() {
    signOut();
    router.replace("/onboarding/sign-in");
  }

  return (
    <Screen testID="profile-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.copy}>
          {isSignedIn
            ? `Using the local learner profile. Progress is saved to ${authProfile?.syncProfileId ?? "local-kavita"} and synced through Supabase.`
            : "Signed out locally. Your prototype progress remains on this device."}
        </Text>
      </View>

      <View style={styles.statusGrid}>
        <StatCard label="Today" value={`${goalStatus.minutesToday}/${goalStatus.dailyGoalMinutes} min`} detail={goalStatus.statusLabel} />
        <StatCard label="Streak" value={`${streakStatus.streakCount || 0} days`} detail={streakStatus.label} />
      </View>

      <View style={styles.progressStack}>
        <GoalProgress
          minutesToday={goalStatus.minutesToday}
          dailyGoalMinutes={goalStatus.dailyGoalMinutes}
          isComplete={goalStatus.isComplete}
          statusLabel={goalStatus.statusLabel}
          nextStep={goalStatus.nextStep}
        />
        <StreakProgress streakCount={streakStatus.streakCount} status={streakStatus} compact={false} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Prototype status</Text>
        <Row label="Account" value={formatAccount(authProfile, isSignedIn)} />
        <Row label="Mode" value={hasCompletedOnboarding ? "Prototype ready" : "Onboarding test"} />
        <Row label="Last active" value={formatActivityDate(lastActiveDate, today)} />
        <Row label="Streak status" value={streakStatus.detail} />
        <Row label="Completed lessons" value={`${completedLessons.length}`} />
        <Row label="Skipped lessons" value={`${skippedLessons.length}`} />
        <Row label="Saved phrases" value={`${savedPhrases.length}`} />
        <Row label="Voice feedback" value={`${feedbackHistory.length}`} />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.badge}>Local</Text>
        </View>
        <Row label="Display name" value={authProfile?.displayName ?? name} />
        <Row label="Sync profile" value={authProfile?.syncProfileId ?? "local-kavita"} />
        <Text style={styles.copy}>Google and Apple sign-in are disabled for this production path. Persistence is handled by Supabase-backed progress sync.</Text>
        <PrimaryActionButton
          label={isSignedIn ? "Sign out locally" : "Go to sign in"}
          variant="ghost"
          onPress={isSignedIn ? signOutLocally : () => router.replace("/onboarding/sign-in")}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress sync</Text>
          <Text style={styles.badge}>{formatSyncStatus(syncStatus)}</Text>
        </View>
        <Text style={styles.copy}>{syncMessage}</Text>
        <Row label="Sync profile" value={authProfile?.syncProfileId ?? "local-kavita"} />
        <Row label="Last sync" value={formatSyncTime(lastSyncAt)} />
        <PrimaryActionButton
          label={syncStatus === "pulling" || syncStatus === "pushing" ? "Syncing progress" : "Sync now"}
          variant="ghost"
          disabled={syncStatus === "pulling" || syncStatus === "pushing"}
          onPress={() => void syncProgress()}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Practice summary</Text>
          <Text style={styles.badge}>{nextAction.meta}</Text>
        </View>
        <Text style={styles.copy}>{nextAction.copy}</Text>
        {latestFeedback ? (
          <View style={styles.feedbackPreview}>
            <Text style={styles.previewLabel}>Latest feedback</Text>
            <Text style={styles.previewText}>{latestFeedback.confidence.note}</Text>
            <Text style={styles.previewDetail}>{latestFeedback.confidence.nextStep}</Text>
          </View>
        ) : null}
        {savedPhrases.length ? (
          <View style={styles.feedbackPreview}>
            <Text style={styles.previewLabel}>Saved phrase</Text>
            <Text style={styles.previewText}>{savedPhrases[0]}</Text>
            <Text style={styles.previewDetail}>
              {savedPhrases.length} phrase{savedPhrases.length === 1 ? "" : "s"} ready for review
            </Text>
          </View>
        ) : null}
        <PrimaryActionButton label={nextAction.label} onPress={() => router.push(nextAction.href)} />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explanation preference</Text>
          <Text style={styles.badge}>{formatPreference(explanationPreference)}</Text>
        </View>
        <View style={styles.optionStack}>
          {explanationOptions.map((option) => {
            const selected = option.value === explanationPreference;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setExplanationPreference(option.value)}
                style={[styles.option, selected && styles.selectedOption]}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDetail}>{option.detail}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily goal</Text>
          <Text style={styles.badge}>{dailyGoalMinutes} min</Text>
        </View>
        <View style={styles.goalRow}>
          {goalOptions.map((goal) => {
            const selected = goal === dailyGoalMinutes;
            return (
              <Pressable
                key={goal}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDailyGoalMinutes(goal)}
                style={[styles.goalOption, selected && styles.selectedOption]}
              >
                <Text style={styles.goalValue}>{goal}</Text>
                <Text style={styles.goalLabel}>min</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.privacy}>
        <Text style={styles.sectionTitle}>Prototype privacy</Text>
        <Text style={styles.copy}>Speech is sent to AI services only when the voice endpoint is configured. Progress syncs to your Supabase-backed learner record when the API is available.</Text>
      </View>
      <PrimaryActionButton label="Reset prototype" variant="ghost" onPress={() => setResetOpen(true)} />
      <ResetConfirmationSheet visible={isResetOpen} onCancel={() => setResetOpen(false)} onConfirm={confirmReset} />
    </Screen>
  );
}

function getProfileNextAction(goalComplete: boolean, hasFeedback: boolean, savedPhraseCount: number) {
  if (!goalComplete) {
    return {
      meta: "Goal",
      copy: "Finish today's goal with a short lesson or speaking practice.",
      label: "Continue learning",
      href: "/learn" as const,
    };
  }

  if (!hasFeedback) {
    return {
      meta: "Feedback",
      copy: "Today's goal is complete. A speaking session will add feedback to your review list.",
      label: "Start speaking",
      href: "/speak" as const,
    };
  }

  if (savedPhraseCount > 0) {
    return {
      meta: "Review",
      copy: "Goal complete. Review one saved phrase to keep it easy tomorrow.",
      label: "Practice phrase",
      href: "/speak/conversation?mode=free" as const,
    };
  }

  return {
    meta: "Ready",
    copy: "Goal complete and feedback saved. Revisit the learning path when you want another small win.",
    label: "Open lessons",
    href: "/learn" as const,
  };
}

function formatActivityDate(dateKey: string | null, today: string) {
  if (!dateKey) return "Not yet";
  if (dateKey === today) return "Today";
  if (dateKey === getPreviousLocalDateKey(today)) return "Yesterday";

  return dateKey;
}

function formatPreference(preference: ExplanationPreference) {
  if (preference === "hi-Deva") return "Hindi";
  if (preference === "hi-Latn") return "Hinglish";
  return "Hindi + Hinglish";
}

function formatProvider(provider?: AuthProfile["provider"]) {
  return "Local";
}

function formatAccount(authProfile: AuthProfile | null, isSignedIn: boolean) {
  if (!isSignedIn) return "Signed out";
  if (!authProfile) return "Local prototype";
  return `${formatProvider(authProfile.provider)} account`;
}

function formatSyncStatus(status: string) {
  if (status === "local-only") return "Local";
  if (status === "pulling" || status === "pushing") return "Syncing";
  if (status === "synced") return "Synced";
  if (status === "error") return "Check";
  return "Ready";
}

function formatSyncTime(value: string | null) {
  if (!value) return "Not yet";

  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently";
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

function ResetConfirmationSheet({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet}>
          <Text style={styles.eyebrow}>Reset prototype</Text>
          <Text style={styles.sheetTitle}>Clear local testing data?</Text>
          <Text style={styles.sheetCopy}>
            This returns the app to the starting prototype state on this device, including onboarding, progress, saved phrases, and feedback history.
          </Text>
          <View style={styles.actions}>
            <PrimaryActionButton label="Keep data" variant="ghost" onPress={onCancel} />
            <PrimaryActionButton label="Reset local data" onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    lineHeight: 22,
  },
  statusGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  progressStack: {
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statLabel: {
    color: colors.muted,
    fontWeight: "800",
  },
  statValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  statDetail: {
    color: colors.secondary,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowLabel: {
    color: colors.muted,
    flex: 1,
  },
  rowValue: {
    color: colors.ink,
    fontWeight: "900",
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  feedbackPreview: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  previewLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewText: {
    color: colors.ink,
    fontWeight: "900",
    lineHeight: 22,
  },
  previewDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  badge: {
    color: colors.primaryDark,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.round,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontWeight: "900",
  },
  optionStack: {
    gap: spacing.sm,
  },
  option: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  optionLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  optionDetail: {
    color: colors.muted,
    lineHeight: 20,
  },
  goalRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  goalOption: {
    flex: 1,
    minHeight: 76,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  goalValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  goalLabel: {
    color: colors.muted,
    fontWeight: "800",
  },
  privacy: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(36, 33, 31, 0.34)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.danger,
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  sheetCopy: {
    color: colors.muted,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
});
