import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle2, Circle, Clock3, SkipForward } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { SkipConfirmationSheet } from "@/src/components/SkipConfirmationSheet";
import { lessons } from "@/src/content/lessons";
import { modules } from "@/src/content/modules";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";

export default function ModuleDetail() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const [skipVisible, setSkipVisible] = useState(false);
  const { skippedModules, skipModule, completedLessons, skippedLessons, skipLesson } = useAppStore();
  const module = modules.find((item) => item.id === moduleId) ?? modules[0];
  const moduleLessons = useMemo(
    () =>
      module.lessonIds
        .map((lessonId) => lessons.find((lesson) => lesson.id === lessonId))
        .filter((lesson): lesson is (typeof lessons)[number] => Boolean(lesson)),
    [module.lessonIds],
  );
  const isSkipped = skippedModules.includes(module.id);
  const completedCount = moduleLessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
  const skippedCount = moduleLessons.filter(
    (lesson) => !completedLessons.includes(lesson.id) && skippedLessons.includes(lesson.id),
  ).length;
  const openCount = isSkipped
    ? 0
    : moduleLessons.filter((lesson) => !completedLessons.includes(lesson.id) && !skippedLessons.includes(lesson.id)).length;
  const totalMinutes = moduleLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);
  const nextLesson = isSkipped
    ? undefined
    : moduleLessons.find((lesson) => !completedLessons.includes(lesson.id) && !skippedLessons.includes(lesson.id));
  const completedModuleLessons = moduleLessons.filter((lesson) => completedLessons.includes(lesson.id));
  const skippedModuleLessons = moduleLessons.filter(
    (lesson) => !completedLessons.includes(lesson.id) && skippedLessons.includes(lesson.id),
  );
  const reviewLesson = completedModuleLessons[completedModuleLessons.length - 1] ?? skippedModuleLessons[0] ?? moduleLessons[0];
  const primaryLesson = nextLesson ?? reviewLesson;
  const moduleProgressPercent = moduleLessons.length ? Math.round((completedCount / moduleLessons.length) * 100) : 0;
  const isComplete = Boolean(moduleLessons.length && completedCount === moduleLessons.length);
  const primaryLabel = nextLesson
    ? `Continue: ${nextLesson.title}`
    : isComplete
      ? "Review completed module"
      : skippedModuleLessons.length
        ? "Resume skipped lesson"
        : "Review first lesson";
  const summaryCopy = isComplete
    ? "Every lesson in this module is complete. A quick review can keep these sentences fresh."
    : isSkipped
      ? "This module is skipped for now. You can still resume any lesson when it feels useful."
      : nextLesson
        ? `${openCount} lesson${openCount === 1 ? "" : "s"} left on this module path.`
        : "No open lessons remain here. Review or resume any lesson below.";
  const skipOverview = moduleLessons.length
    ? moduleLessons.map((lesson) => `${lesson.title}: ${lesson.skipOverview.join(", ")}`)
    : [module.overview];

  function confirmSkip() {
    skipModule(module.id);
    moduleLessons.forEach((lesson) => {
      if (!completedLessons.includes(lesson.id)) {
        skipLesson(lesson.id);
      }
    });
    setSkipVisible(false);
    router.back();
  }

  function openLesson(lessonId: string) {
    router.push(`/learn/lesson/${lessonId}`);
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.metaRow}>
          <Text style={styles.level}>
            Stage {module.stage} - {module.level}
          </Text>
          <Text style={styles.metaCopy}>
            {moduleLessons.length} lessons • {totalMinutes} min
          </Text>
        </View>
        <Text style={styles.title}>{module.title}</Text>
        <Text style={styles.copy}>{module.overview}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${moduleProgressPercent}%` },
            ]}
          />
        </View>
        <View style={styles.statusGrid}>
          <ProgressPill label="Completed" value={completedCount} tone="success" />
          <ProgressPill label="Open" value={openCount} tone="primary" />
          <ProgressPill label="Skipped" value={skippedCount} tone="muted" />
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{isComplete ? "Module complete" : isSkipped ? "Skipped module" : "Module summary"}</Text>
          <Text style={styles.summaryCopy}>{summaryCopy}</Text>
        </View>
        <View style={styles.challengeBox}>
          <Text style={styles.summaryTitle}>Skill focus</Text>
          <Text style={styles.summaryCopy}>{module.skillFocus}</Text>
          <Text style={styles.challengeTitle}>Next challenge</Text>
          <Text style={styles.summaryCopy}>{module.challenge}</Text>
        </View>
        {isSkipped ? <Text style={styles.skipped}>Marked skipped. You can still practice any lesson here.</Text> : null}
        {primaryLesson ? (
          <PrimaryActionButton
            label={primaryLabel}
            onPress={() => openLesson(primaryLesson.id)}
          />
        ) : null}
      </View>

      {completedModuleLessons.length || skippedModuleLessons.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review and resume</Text>
          <View style={styles.reviewList}>
            {[...completedModuleLessons.slice(-2), ...skippedModuleLessons.slice(0, 2)].slice(0, 3).map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);

              return (
                <Pressable
                  key={lesson.id}
                  accessibilityRole="button"
                  onPress={() => openLesson(lesson.id)}
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
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Module overview</Text>
        {moduleLessons.length ? (
          <View style={styles.overviewList}>
            {moduleLessons.map((lesson, index) => (
              <View key={lesson.id} style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>{index + 1}</Text>
                <View style={styles.overviewText}>
                  <Text style={styles.overviewTitle}>{lesson.title}</Text>
                  <Text style={styles.overviewCopy}>{lesson.skipOverview.join(" • ")}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.copy}>Lessons for this module will be added after the first prototype lesson.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lessons</Text>
        {moduleLessons.length ? (
          moduleLessons.map((lesson, index) => {
            const status = completedLessons.includes(lesson.id)
              ? "completed"
              : skippedLessons.includes(lesson.id)
                ? "skipped"
                : "ready";

            return (
              <Pressable
                key={lesson.id}
                accessibilityRole="button"
                onPress={() => openLesson(lesson.id)}
                style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}
              >
                <View style={styles.lessonIconWrap}>
                  <LessonStatusIcon status={status} />
                </View>
                <View style={styles.lessonText}>
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonStep}>Lesson {index + 1}</Text>
                    <Text style={[styles.lessonStatus, status === "completed" && styles.completedStatus]}>
                      {status === "completed" ? "Completed" : status === "skipped" ? "Skipped" : `${lesson.durationMinutes} min`}
                    </Text>
                  </View>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonCopy}>{lesson.overview}</Text>
                  <View style={styles.lessonFooter}>
                    <Clock3 color={colors.muted} size={15} />
                    <Text style={styles.lessonMeta}>{lesson.activities.length} practice steps</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.copy}>Lessons for this module will be added after the first prototype lesson.</Text>
        )}
      </View>
      <PrimaryActionButton
        label={isSkipped ? "Module already skipped" : "Skip module"}
        variant="ghost"
        disabled={isSkipped}
        onPress={() => setSkipVisible(true)}
      />
      <SkipConfirmationSheet
        visible={skipVisible}
        title={module.title}
        overview={skipOverview}
        onCancel={() => setSkipVisible(false)}
        onConfirm={confirmSkip}
      />
    </Screen>
  );
}

function ProgressPill({ label, value, tone }: { label: string; value: number; tone: "success" | "primary" | "muted" }) {
  return (
    <View style={styles.progressPill}>
      <Text
        style={[
          styles.progressValue,
          tone === "success" && styles.successText,
          tone === "primary" && styles.primaryText,
          tone === "muted" && styles.mutedText,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  );
}

function LessonStatusIcon({ status }: { status: "ready" | "completed" | "skipped" }) {
  if (status === "completed") {
    return <CheckCircle2 color={colors.success} size={24} />;
  }

  if (status === "skipped") {
    return <SkipForward color={colors.muted} size={24} />;
  }

  return <Circle color={colors.primary} size={24} />;
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  level: {
    color: colors.secondary,
    fontWeight: "900",
    flexShrink: 1,
  },
  metaCopy: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 12,
    flexShrink: 0,
    textAlign: "right",
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    lineHeight: 22,
  },
  skipped: {
    color: colors.primary,
    fontWeight: "800",
  },
  summaryBox: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.xs,
  },
  challengeBox: {
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: radii.sm,
    backgroundColor: colors.secondarySoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  challengeTitle: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    paddingTop: spacing.xs,
    textTransform: "uppercase",
  },
  summaryCopy: {
    color: colors.muted,
    lineHeight: 20,
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
  statusGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  progressPill: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  successText: {
    color: colors.success,
  },
  primaryText: {
    color: colors.primary,
  },
  mutedText: {
    color: colors.muted,
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  reviewList: {
    gap: spacing.sm,
  },
  reviewRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  overviewList: {
    gap: spacing.sm,
  },
  overviewItem: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  overviewNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.round,
    overflow: "hidden",
    backgroundColor: colors.secondarySoft,
    color: colors.secondary,
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "900",
  },
  overviewText: {
    flex: 1,
    gap: spacing.xs,
  },
  overviewTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  overviewCopy: {
    color: colors.muted,
    lineHeight: 20,
  },
  lessonCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  pressed: {
    opacity: 0.84,
  },
  lessonIconWrap: {
    paddingTop: 2,
  },
  lessonText: {
    flex: 1,
    gap: spacing.xs,
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lessonStep: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  lessonStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  completedStatus: {
    color: colors.success,
  },
  lessonTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  lessonCopy: {
    color: colors.muted,
    lineHeight: 21,
  },
  lessonFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  lessonMeta: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },
});
