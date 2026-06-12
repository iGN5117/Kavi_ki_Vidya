import { router } from "expo-router";
import { CheckCircle2, Circle, RotateCcw, SkipForward } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GoalProgress } from "@/src/components/GoalProgress";
import { LessonCard } from "@/src/components/LessonCard";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { StreakProgress } from "@/src/components/StreakProgress";
import { formatLessonSkillTag, getLessonSkillTags } from "@/src/content/lessonSkillProfiles";
import { lessons } from "@/src/content/lessons";
import { modules } from "@/src/content/modules";
import { getAdaptiveLessonRecommendation } from "@/src/services/adaptive/practicePlan";
import { getLocalDateKey, useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";

export default function LearnHome() {
  const {
    streakCount,
    minutesToday,
    dailyProgressDate,
    dailyGoalMinutes,
    completedLessons,
    skippedLessons,
    skippedModules,
    feedbackHistory,
    mistakes,
    reviewQueue,
    lessonAttempts,
    drillResults,
  } = useAppStore();
  const todayMinutes = dailyProgressDate === getLocalDateKey() ? minutesToday : 0;
  const orderedLessonIds = modules.flatMap((module) => module.lessonIds);
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const orderedLessons = orderedLessonIds
    .map((lessonId) => lessons.find((lesson) => lesson.id === lessonId))
    .filter((lesson): lesson is (typeof lessons)[number] => Boolean(lesson));
  const nextLesson = orderedLessons.find(
    (lesson) =>
      !completedLessons.includes(lesson.id) &&
      !skippedLessons.includes(lesson.id) &&
      !skippedModules.includes(lesson.moduleId),
  );
  const lessonModuleById = new Map(orderedLessons.map((lesson) => [lesson.id, lesson.moduleId]));
  const lessonSkillTagsById = new Map(orderedLessons.map((lesson) => [lesson.id, getLessonSkillTags(lesson.id)]));
  const adaptiveRecommendation = getAdaptiveLessonRecommendation({
    feedbackHistory,
    mistakes,
    reviewQueue,
    lessonAttempts,
    drillResults,
    completedLessons,
    skippedLessons,
    skippedModules,
    lessonModuleById,
    lessonSkillTagsById,
  });
  const adaptiveLesson = adaptiveRecommendation
    ? orderedLessons.find((lesson) => lesson.id === adaptiveRecommendation.lessonId)
    : undefined;
  const reviewLessons = orderedLessons.filter((lesson) => completedLessons.includes(lesson.id) || skippedLessons.includes(lesson.id));
  const reviewLesson = reviewLessons[reviewLessons.length - 1] ?? orderedLessons[0] ?? lessons[0];
  const recommendedLesson = adaptiveLesson ?? nextLesson ?? reviewLesson;
  const recommendedModule = moduleById.get(recommendedLesson.moduleId);
  const totalLessons = orderedLessons.length;
  const completedCount = orderedLessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
  const skippedLessonCount = orderedLessons.filter((lesson) => skippedLessons.includes(lesson.id)).length;
  const availableLessonCount = orderedLessons.filter((lesson) => !skippedModules.includes(lesson.moduleId)).length;
  const openLessonCount = orderedLessons.filter(
    (lesson) =>
      !completedLessons.includes(lesson.id) &&
      !skippedLessons.includes(lesson.id) &&
      !skippedModules.includes(lesson.moduleId),
  ).length;
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  const completedModules = modules.filter((module) =>
    module.lessonIds.length ? module.lessonIds.every((lessonId) => completedLessons.includes(lessonId)) : false,
  ).length;
  const recommendationLabel = adaptiveRecommendation ? "Recommended from review" : nextLesson ? "Continue today" : "Review and keep warm";
  const recommendationActionLabel = adaptiveRecommendation ? "Start recommended lesson" : nextLesson ? "Start lesson" : "Review lesson";
  const recommendationCopy = adaptiveRecommendation
    ? `${adaptiveRecommendation.focus.title}: ${adaptiveRecommendation.focus.detail}`
    : nextLesson
      ? "Your next lesson stays on the active path and skips anything you already passed over."
      : "All active lessons are done or skipped. Revisit one lesson to keep the habit easy.";
  const recommendationSkillTags = adaptiveRecommendation?.matchedSkillTags.slice(0, 3) ?? [];

  return (
    <Screen testID="learn-screen">
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.eyebrow}>Learn</Text>
          <StreakProgress testID="learn-streak-progress" streakCount={streakCount} />
        </View>
        <Text style={styles.title}>A little English today</Text>
      </View>
      <GoalProgress minutesToday={todayMinutes} dailyGoalMinutes={dailyGoalMinutes} />
      <View style={styles.pathCard}>
        <View style={styles.pathHeader}>
          <View>
            <Text style={styles.cardTitle}>Learning path</Text>
            <Text style={styles.cardCopy}>
              {completedCount} of {totalLessons} lessons complete
            </Text>
          </View>
          <Text style={styles.percent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.summaryGrid}>
          <SummaryPill label="Active" value={availableLessonCount} />
          <SummaryPill label="Open" value={openLessonCount} />
          <SummaryPill label="Modules done" value={completedModules} />
        </View>
        {skippedModules.length || skippedLessonCount ? (
          <Text style={styles.note}>
            Skipped: {skippedModules.length} module{skippedModules.length === 1 ? "" : "s"}
            {skippedLessonCount ? `, ${skippedLessonCount} lesson${skippedLessonCount === 1 ? "" : "s"}` : ""}
          </Text>
        ) : null}
      </View>

      <View style={styles.dailyCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.cardTitle}>{recommendationLabel}</Text>
            {recommendedModule ? (
              <Text style={styles.recommendationMeta}>
                Stage {recommendedModule.stage} - {recommendedModule.level}
              </Text>
            ) : null}
            <Text style={styles.cardCopy}>{recommendationCopy}</Text>
          </View>
        </View>
        <PrimaryActionButton
          testID="learn-start-lesson-button"
          label={recommendationActionLabel}
          onPress={() => router.push(`/learn/lesson/${recommendedLesson.id}`)}
        />
        {adaptiveRecommendation ? (
          <View style={styles.whyCard}>
            <Text style={styles.whyLabel}>Why this lesson</Text>
            <Text style={styles.whyCopy}>{adaptiveRecommendation.reason}</Text>
            {recommendationSkillTags.length ? (
              <View style={styles.skillRow}>
                {recommendationSkillTags.map((tag) => (
                  <Text key={tag} style={styles.skillBadge}>
                    {formatLessonSkillTag(tag)}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        <LessonCard
          title={recommendedLesson.title}
          overview={recommendedLesson.overview}
          status={
            completedLessons.includes(recommendedLesson.id)
              ? "completed"
              : skippedLessons.includes(recommendedLesson.id)
                ? "skipped"
                : "ready"
          }
          onPress={() => router.push(`/learn/lesson/${recommendedLesson.id}`)}
        />
      </View>

      {reviewLessons.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review and resume</Text>
            <RotateCcw color={colors.primary} size={20} />
          </View>
          {reviewLessons.slice(-3).map((lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);

            return (
              <Pressable
                key={lesson.id}
                accessibilityRole="button"
                accessibilityLabel={`${lesson.title}. ${isCompleted ? "Completed lesson" : "Skipped lesson, ready to resume"}`}
                onPress={() => router.push(`/learn/lesson/${lesson.id}`)}
                style={({ pressed }) => [styles.reviewRow, pressed && styles.pressed]}
              >
                {isCompleted ? <CheckCircle2 color={colors.success} size={22} /> : <SkipForward color={colors.muted} size={22} />}
                <View style={styles.reviewText}>
                  <Text style={styles.reviewTitle}>{lesson.title}</Text>
                  <Text style={styles.reviewMeta}>{isCompleted ? "Completed lesson" : "Skipped lesson, ready to resume"}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Path overview</Text>
        {modules.map((module, index) => {
          const moduleLessons = module.lessonIds
            .map((lessonId) => lessons.find((lesson) => lesson.id === lessonId))
            .filter((lesson): lesson is (typeof lessons)[number] => Boolean(lesson));
          const completeCount = moduleLessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
          const skippedCount = moduleLessons.filter(
            (lesson) => !completedLessons.includes(lesson.id) && skippedLessons.includes(lesson.id),
          ).length;
          const isSkipped = skippedModules.includes(module.id);
          const hasNextLesson = Boolean(nextLesson && nextLesson.moduleId === module.id);
          const totalCount = moduleLessons.length;
          const status = isSkipped
            ? "Skipped"
            : totalCount && completeCount === totalCount
              ? "Complete"
              : hasNextLesson
                ? "Next up"
                : completeCount || skippedCount
                  ? "In progress"
                  : "Ready";

          return (
            <Pressable
              key={module.id}
              accessibilityRole="button"
              accessibilityLabel={`${module.title}. ${status}. ${completeCount} of ${totalCount} lessons complete${skippedCount ? `, ${skippedCount} skipped` : ""}.`}
              onPress={() => router.push(`/learn/module/${module.id}`)}
              style={({ pressed }) => [styles.pathStep, pressed && styles.pressed, hasNextLesson && styles.pathStepActive]}
            >
              <View style={styles.stepIcon}>
                {status === "Complete" ? (
                  <CheckCircle2 color={colors.success} size={22} />
                ) : status === "Skipped" ? (
                  <SkipForward color={colors.muted} size={22} />
                ) : (
                  <Circle color={hasNextLesson ? colors.primary : colors.secondary} size={22} />
                )}
              </View>
              <View style={styles.stepText}>
                <View style={styles.moduleMetaRow}>
                  <Text style={styles.moduleLevel}>
                    Stage {module.stage} - {module.level}
                  </Text>
                  <Text style={[styles.moduleProgress, hasNextLesson && styles.nextText]}>{status}</Text>
                </View>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleCopy} numberOfLines={2}>
                  {module.skillFocus}
                </Text>
                <Text style={styles.moduleMetaText}>
                  {completeCount}/{totalCount} complete{skippedCount ? ` • ${skippedCount} skipped` : ""}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modules</Text>
        {modules.map((module) => {
          const completeCount = module.lessonIds.filter((lessonId) => completedLessons.includes(lessonId)).length;
          const skippedCount = module.lessonIds.filter((lessonId) => skippedLessons.includes(lessonId)).length;
          const totalCount = module.lessonIds.length;
          const isSkipped = skippedModules.includes(module.id);

          return (
            <View key={module.id} style={styles.moduleCard}>
              <View style={styles.moduleMetaRow}>
                <Text style={styles.moduleLevel}>
                  Stage {module.stage} - {module.level}
                </Text>
                <Text style={styles.moduleProgress}>
                  {isSkipped ? "Skipped module" : `${completeCount}/${totalCount} complete${skippedCount ? ` • ${skippedCount} skipped` : ""}`}
                </Text>
              </View>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleFocus}>{module.skillFocus}</Text>
              <Text style={styles.moduleCopy}>{module.overview}</Text>
              <Text style={styles.moduleChallenge}>Next challenge: {module.challenge}</Text>
              <PrimaryActionButton label="View module" variant="ghost" onPress={() => router.push(`/learn/module/${module.id}`)} />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  dailyCard: {
    gap: spacing.md,
  },
  pathCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pathHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  cardCopy: {
    color: colors.muted,
    lineHeight: 20,
    paddingTop: spacing.xs,
  },
  whyCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  whyLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  whyCopy: {
    color: colors.ink,
    lineHeight: 21,
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  skillBadge: {
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    borderRadius: radii.round,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: "900",
  },
  recommendationMeta: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    paddingTop: spacing.xs,
  },
  percent: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.round,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.secondary,
    borderRadius: radii.round,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  note: {
    color: colors.muted,
    fontWeight: "800",
    lineHeight: 20,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  reviewRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  reviewText: {
    flex: 1,
    gap: spacing.xs,
  },
  reviewTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  reviewMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  pathStep: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  pathStepActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  stepIcon: {
    paddingTop: 2,
  },
  stepText: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.84,
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  moduleLevel: {
    color: colors.secondary,
    fontWeight: "900",
    fontSize: 12,
    flexShrink: 1,
  },
  moduleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  moduleProgress: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 12,
    flexShrink: 0,
    textAlign: "right",
  },
  nextText: {
    color: colors.primary,
  },
  moduleTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  moduleCopy: {
    color: colors.muted,
    lineHeight: 21,
  },
  moduleFocus: {
    color: colors.ink,
    lineHeight: 21,
    fontWeight: "800",
  },
  moduleChallenge: {
    color: colors.primary,
    lineHeight: 20,
    fontWeight: "800",
  },
  moduleMetaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
});

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}
