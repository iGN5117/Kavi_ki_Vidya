import type { ReactNode } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { GoalProgress } from "@/src/components/GoalProgress";
import { PracticeSessionReceiptCard } from "@/src/components/PracticeSessionReceiptCard";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { StreakProgress } from "@/src/components/StreakProgress";
import { formatLessonSkillTag } from "@/src/content/lessonSkillProfiles";
import { getLearnerPracticePlan, type PracticeFocus } from "@/src/services/adaptive/practicePlan";
import { getDailyGoalStatus, getStreakStatus, useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";

export default function ReviewScreen() {
  const {
    savedPhrases,
    mistakes,
    feedbackHistory,
    lessonAttempts,
    reviewQueue,
    drillResults,
    dailyGoalMinutes,
    minutesToday,
    dailyProgressDate,
    streakCount,
    lastActiveDate,
    completeReviewItem,
  } = useAppStore();
  const latestFeedback = feedbackHistory[0];
  const latestLessonAttempt = lessonAttempts[0];
  const latestDrillResult = drillResults[0];
  const openReviewItems = reviewQueue.filter((item) => !item.completedAt && isReviewDue(item.dueAt)).slice(0, 5);
  const laterReviewCount = reviewQueue.filter((item) => !item.completedAt && !isReviewDue(item.dueAt)).length;
  const recentFeedback = feedbackHistory.slice(1, 3);
  const goalStatus = getDailyGoalStatus({ dailyGoalMinutes, minutesToday, dailyProgressDate });
  const streakStatus = getStreakStatus({ dailyGoalMinutes, minutesToday, dailyProgressDate, streakCount, lastActiveDate });
  const practicePlan = getLearnerPracticePlan({ feedbackHistory, mistakes, reviewQueue, lessonAttempts, drillResults });
  const priorityFocus = practicePlan[0];
  const nextAction = getNextAction(goalStatus.isComplete, savedPhrases.length, Boolean(latestFeedback), priorityFocus);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.copy}>Practice useful phrases and gently revisit common mistakes from speaking sessions.</Text>
      </View>
      <View style={styles.progressSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.sectionMeta}>{streakStatus.label}</Text>
        </View>
        <GoalProgress
          minutesToday={goalStatus.minutesToday}
          dailyGoalMinutes={goalStatus.dailyGoalMinutes}
          isComplete={goalStatus.isComplete}
          statusLabel={goalStatus.statusLabel}
          nextStep={goalStatus.nextStep}
        />
        <StreakProgress streakCount={streakStatus.streakCount} status={streakStatus} compact={false} />
      </View>
      <Section title="Next up" meta={nextAction.meta}>
        <Text style={styles.item}>{nextAction.copy}</Text>
        <PrimaryActionButton label={nextAction.label} onPress={() => router.push(nextAction.href)} />
      </Section>
      {practicePlan.length ? (
        <Section title="Personal practice plan" meta={`${practicePlan.length} focus${practicePlan.length === 1 ? "" : "es"}`}>
          {practicePlan.slice(0, 3).map((focus) => (
            <View key={focus.id} style={styles.practicePlanItem}>
              <View style={styles.reviewQueueHeader}>
                <Text style={styles.label}>{focus.title}</Text>
                <Text style={styles.sourceBadge}>{formatFocusKind(focus.kind)}</Text>
              </View>
              <Text style={styles.phrase}>{focus.prompt}</Text>
              <Text style={styles.subtle}>{focus.detail}</Text>
              {focus.skillTags?.length ? (
                <View style={styles.skillRow}>
                  {focus.skillTags.slice(0, 3).map((tag) => (
                    <Text key={tag} style={styles.skillBadge}>
                      {formatLessonSkillTag(tag)}
                    </Text>
                  ))}
                </View>
              ) : null}
              <PrimaryActionButton label={focus.actionLabel} variant="ghost" onPress={() => openPracticeFocus(focus)} />
            </View>
          ))}
        </Section>
      ) : null}
      <Section title="Review queue" meta={laterReviewCount ? `${openReviewItems.length} ready · ${laterReviewCount} later` : `${openReviewItems.length} ready`}>
        {openReviewItems.length ? (
          openReviewItems.map((item) => (
            <View key={item.id} style={styles.reviewQueueItem}>
              <View style={styles.reviewQueueHeader}>
                <Text style={styles.label}>{item.title}</Text>
                <Text style={styles.sourceBadge}>{item.source === "lesson" ? "Lesson" : "Speaking"}</Text>
              </View>
              <Text style={styles.phrase}>{item.prompt}</Text>
              <Text style={styles.subtle}>{item.detail}</Text>
              {item.dueAt ? <Text style={styles.subtle}>Due {formatDueDate(item.dueAt)}</Text> : null}
              {item.practiceCount ? (
                <Text style={styles.subtle}>
                  Practiced {item.practiceCount} time{item.practiceCount === 1 ? "" : "s"}
                  {item.lastResult ? ` · ${formatOutcome(item.lastResult)}` : ""}
                </Text>
              ) : null}
              <View style={styles.reviewActions}>
                <PrimaryActionButton label="Practice now" onPress={() => openPracticeItem(item)} />
                <PrimaryActionButton label="Mark practiced" variant="ghost" onPress={() => completeReviewItem(item.id)} />
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="Nothing due right now"
            copy={laterReviewCount ? `${laterReviewCount} review item${laterReviewCount === 1 ? "" : "s"} scheduled for later.` : "Missed lesson answers and speaking retry words will collect here."}
          />
        )}
      </Section>
      {latestDrillResult ? (
        <Section title="Latest drill result" meta={formatAttemptDate(latestDrillResult.practicedAt)}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{formatOutcome(latestDrillResult.outcome)}</Text>
            {typeof latestDrillResult.score === "number" ? (
              <Text style={styles.subtle}>Pronunciation score: {Math.round(latestDrillResult.score)}%</Text>
            ) : null}
          </View>
          <Text style={styles.phrase}>{latestDrillResult.target}</Text>
          <Text style={styles.item}>{latestDrillResult.summary}</Text>
          {latestDrillResult.tips.slice(0, 2).map((tip, index) => (
            <Text key={`${tip}-${index}`} style={styles.subtle}>
              {tip}
            </Text>
          ))}
        </Section>
      ) : null}
      {latestLessonAttempt ? (
        <Section title="Latest lesson score" meta={formatAttemptDate(latestLessonAttempt.completedAt)}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{latestLessonAttempt.score}%</Text>
            <Text style={styles.subtle}>
              {latestLessonAttempt.correctCount}/{latestLessonAttempt.checkedCount || 0} checked answers correct
            </Text>
          </View>
          {latestLessonAttempt.retryCount ? (
            <Text style={styles.item}>
              {latestLessonAttempt.retryCount} sentence{latestLessonAttempt.retryCount === 1 ? "" : "s"} moved into Review.
            </Text>
          ) : (
            <Text style={styles.item}>No missed checked answers in this lesson.</Text>
          )}
        </Section>
      ) : null}
      {latestFeedback?.sessionReceipt ? (
        <PracticeSessionReceiptCard
          receipt={latestFeedback.sessionReceipt}
          onPracticeSentence={openReceiptPracticeSentence}
          onOpenLesson={openReceiptLesson}
        />
      ) : null}
      {latestFeedback ? (
        <Section title="Latest speaking feedback" meta="From your last speaking session">
          <FeedbackBlock label="Confidence" body={latestFeedback.confidence.note} detail={latestFeedback.confidence.nextStep} />
          <FeedbackBlock
            label="Pronunciation"
            body={latestFeedback.pronunciation.summary}
            detail={
              latestFeedback.pronunciation.retryWords.length
                ? `Practice: ${latestFeedback.pronunciation.retryWords.join(", ")}`
                : "No retry words saved from this session."
            }
          />
          {typeof latestFeedback.pronunciation.score === "number" || latestFeedback.pronunciation.tips?.length ? (
            <View style={styles.feedbackGroup}>
              {typeof latestFeedback.pronunciation.score === "number" ? (
                <Text style={styles.item}>Pronunciation score: {Math.round(latestFeedback.pronunciation.score)}%</Text>
              ) : null}
              {latestFeedback.pronunciation.tips?.map((tip, index) => (
                <Text key={`${tip}-${index}`} style={styles.subtle}>
                  {tip}
                </Text>
              ))}
            </View>
          ) : null}
          {latestFeedback.grammar.improvedSentences.length ? (
            <View style={styles.feedbackGroup}>
              <Text style={styles.label}>Grammar</Text>
              {latestFeedback.grammar.improvedSentences.map((item) => (
                <View key={`${item.original ?? "sentence"}-${item.improved}`} style={styles.listItem}>
                  {item.original ? <Text style={styles.subtle}>You said: {item.original}</Text> : null}
                  <Text style={styles.item}>{item.improved}</Text>
                  <Text style={styles.subtle}>{item.explanation["hi-Latn"] ?? item.explanation["hi-Deva"]}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <PrimaryActionButton label="Practice again" onPress={() => router.push("/speak/conversation?mode=free")} />
          {recentFeedback.length ? (
            <View style={styles.feedbackGroup}>
              <Text style={styles.label}>Recent notes</Text>
              {recentFeedback.map((feedback, index) => (
                <View key={`${feedback.confidence.note}-${index}`} style={styles.listItem}>
                  <Text style={styles.item}>{feedback.confidence.note}</Text>
                  <Text style={styles.subtle}>{feedback.confidence.nextStep}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Section>
      ) : (
        <Section title="Latest speaking feedback" meta="No session yet">
          <EmptyState
            title="Your feedback will appear here"
            copy="Complete a short speaking practice to collect pronunciation, grammar, and confidence notes."
          />
          <PrimaryActionButton label="Start speaking" onPress={() => router.push("/speak")} />
        </Section>
      )}
      <Section title="Saved phrases" meta={`${savedPhrases.length} saved`}>
        {savedPhrases.length ? (
          savedPhrases.map((phrase) => (
            <View key={phrase} style={styles.listItem}>
              <Text style={styles.phrase}>{phrase}</Text>
              <Text style={styles.subtle}>Use this in free chat when you practice again.</Text>
              <PrimaryActionButton
                label="Practice now"
                variant="ghost"
                onPress={() =>
                  openPracticeItem({
                    id: `saved-${phrase}`,
                    source: "speaking",
                    prompt: phrase,
                    detail: "Say this saved phrase slowly, then naturally.",
                  })
                }
              />
            </View>
          ))
        ) : (
          <EmptyState title="No saved phrases yet" copy="Useful phrases from speaking practice will collect here for quick review." />
        )}
        {savedPhrases.length ? (
          <PrimaryActionButton label="Practice saved phrases" variant="ghost" onPress={() => router.push("/speak/conversation?mode=free")} />
        ) : null}
      </Section>
      <Section title="My mistakes" meta={`${mistakes.length} to revisit`}>
        {mistakes.length ? (
          mistakes.map((mistake) => (
            <View key={mistake} style={styles.mistakeItem}>
              <Text style={styles.item}>{mistake}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No mistakes saved yet" copy="When the coach notices a pattern, it will appear here in a gentle practice list." />
        )}
      </Section>
    </Screen>
  );
}

function openPracticeFocus(focus: PracticeFocus) {
  router.push(focus.actionHref);
}

function openPracticeItem(item: {
  id: string;
  source: "lesson" | "speaking";
  prompt: string;
  detail: string;
}) {
  const query = new URLSearchParams({
    mode: "free",
    practiceItemId: item.id,
    practiceSource: item.source,
    practicePrompt: item.prompt,
    practiceDetail: item.detail,
  });

  router.push(`/speak/conversation?${query.toString()}`);
}

function openReceiptPracticeSentence(sentence: string) {
  openPracticeItem({
    id: `session-receipt-${Date.now()}`,
    source: "speaking",
    prompt: sentence,
    detail: "Practice this line from your last speaking session.",
  });
}

function openReceiptLesson(lessonId: string) {
  router.push(`/learn/lesson/${lessonId}`);
}

function getNextAction(goalComplete: boolean, savedPhraseCount: number, hasFeedback: boolean, priorityFocus?: PracticeFocus) {
  if (priorityFocus) {
    return {
      meta: "Personal practice",
      copy: `${priorityFocus.title}. ${priorityFocus.detail}`,
      label: priorityFocus.actionLabel,
      href: priorityFocus.actionHref,
    };
  }

  if (!goalComplete) {
    return {
      meta: "Daily goal",
      copy: "A short lesson or speaking practice will move today from progress to complete.",
      label: "Continue learning",
      href: "/learn" as const,
    };
  }

  if (savedPhraseCount > 0) {
    return {
      meta: "Review",
      copy: "Today's goal is done. Keep momentum by practicing one saved phrase out loud.",
      label: "Practice saved phrases",
      href: "/speak/conversation?mode=free" as const,
    };
  }

  if (!hasFeedback) {
    return {
      meta: "Speaking",
      copy: "You have the goal handled. A quick speaking session will create feedback to review here.",
      label: "Start speaking",
      href: "/speak" as const,
    };
  }

  return {
    meta: "Keep warm",
    copy: "Goal complete and feedback saved. Revisit a lesson when you want a light refresh.",
    label: "Review lessons",
    href: "/learn" as const,
  };
}

function formatFocusKind(kind: PracticeFocus["kind"]) {
  if (kind === "grammar") return "Grammar";
  if (kind === "pronunciation") return "Pronunciation";
  if (kind === "lesson") return "Lesson";
  return "Confidence";
}

function Section({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function FeedbackBlock({ label, body, detail }: { label: string; body: string; detail: string }) {
  return (
    <View style={styles.feedbackGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.item}>{body}</Text>
      <Text style={styles.subtle}>{detail}</Text>
    </View>
  );
}

function formatAttemptDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Recent";
  }
}

function isReviewDue(value?: string | null) {
  if (!value) return true;
  return Date.parse(value) <= Date.now();
}

function formatDueDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "soon";

  const now = Date.now();
  const diffDays = Math.ceil((timestamp - now) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "now";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

function formatOutcome(outcome: string) {
  if (outcome === "improved") return "Improved";
  if (outcome === "needs-retry") return "Needs retry";
  return "Practiced";
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.subtle}>{copy}</Text>
    </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  progressSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionMeta: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "900",
  },
  label: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  feedbackGroup: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: {
    color: colors.ink,
    lineHeight: 22,
  },
  subtle: {
    color: colors.muted,
    lineHeight: 20,
    fontSize: 13,
  },
  listItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  phrase: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },
  mistakeItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  reviewQueueItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  practicePlanItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  reviewQueueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sourceBadge: {
    color: colors.primaryDark,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.round,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: "900",
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  skillBadge: {
    color: colors.primaryDark,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.round,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: "900",
  },
  reviewActions: {
    gap: spacing.sm,
  },
  scoreRow: {
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  scoreValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
  },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
});
