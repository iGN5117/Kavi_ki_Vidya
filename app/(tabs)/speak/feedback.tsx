import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { CoachAvatar } from "@/src/components/CoachAvatar";
import { FeedbackSummary } from "@/src/components/FeedbackSummary";
import { PracticeSessionReceiptCard } from "@/src/components/PracticeSessionReceiptCard";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { buildLocalFeedback } from "@/src/services/feedback/sampleFeedback";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, spacing } from "@/src/theme/theme";

const emptySessionFeedback = buildLocalFeedback([]);

export default function FeedbackScreen() {
  const params = useLocalSearchParams<{ showDrill?: string }>();
  const latestFeedback = useAppStore((state) => state.feedbackHistory[0]) ?? emptySessionFeedback;
  const storedDrillResult = useAppStore((state) => state.drillResults[0]);
  const latestDrillResult = params.showDrill === "1" ? storedDrillResult : undefined;
  const savedPhrases = useAppStore((state) => state.savedPhrases);
  const savePhrase = useAppStore((state) => state.savePhrase);

  return (
    <Screen>
      <View style={styles.header}>
        <CoachAvatar state="encouraging" size={120} />
        <Text style={styles.title}>{latestDrillResult ? "Drill complete" : "Good effort"}</Text>
        <Text style={styles.copy}>
          {latestDrillResult
            ? "Your drill result and next practice tip are ready."
            : "Here is feedback from your speaking session."}
        </Text>
      </View>
      {latestDrillResult ? (
        <View style={styles.drillCard}>
          <Text style={styles.eyebrow}>Focused drill</Text>
          <Text style={styles.drillTarget}>{latestDrillResult.target}</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultValue}>{formatOutcome(latestDrillResult.outcome)}</Text>
            {typeof latestDrillResult.score === "number" ? (
              <Text style={styles.resultScore}>{Math.round(latestDrillResult.score)}%</Text>
            ) : null}
          </View>
          <Text style={styles.copy}>{latestDrillResult.summary}</Text>
          {latestDrillResult.tips.map((tip, index) => (
            <Text key={`${tip}-${index}`} style={styles.tip}>
              {tip}
            </Text>
          ))}
        </View>
      ) : null}
      {!latestDrillResult ? (
        <PracticeSessionReceiptCard
          receipt={latestFeedback.sessionReceipt}
          onPracticeSentence={openPracticeSentence}
          onOpenLesson={openLesson}
        />
      ) : null}
      <FeedbackSummary feedback={latestFeedback} savedPhrases={savedPhrases} onSavePhrase={savePhrase} />
      <PrimaryActionButton label={latestDrillResult ? "Back to Review" : "Practice again"} onPress={() => router.replace(latestDrillResult ? "/review" : "/speak")} />
    </Screen>
  );
}

function openPracticeSentence(sentence: string) {
  const query = new URLSearchParams({
    mode: "free",
    practiceSource: "speaking",
    practicePrompt: sentence,
    practiceDetail: "Practice this line from your last speaking session.",
  });
  router.push(`/speak/conversation?${query.toString()}`);
}

function openLesson(lessonId: string) {
  router.push(`/learn/lesson/${lessonId}`);
}

function formatOutcome(outcome: string) {
  if (outcome === "improved") return "Improved";
  if (outcome === "needs-retry") return "Needs retry";
  return "Practiced";
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  drillCard: {
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  drillTarget: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 29,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  resultValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900",
  },
  resultScore: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  tip: {
    color: colors.muted,
    lineHeight: 21,
  },
});
