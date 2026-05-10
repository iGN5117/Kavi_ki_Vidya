import { BookOpen, CheckCircle2, Repeat2, Sparkles } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { PracticeSessionReceipt } from "@/src/types/speaking";

type PracticeSessionReceiptCardProps = {
  receipt?: PracticeSessionReceipt;
  onPracticeSentence?: (sentence: string) => void;
  onOpenLesson?: (lessonId: string) => void;
};

export function PracticeSessionReceiptCard({ receipt, onPracticeSentence, onOpenLesson }: PracticeSessionReceiptCardProps) {
  if (!receipt) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Session receipt</Text>
          <Text style={styles.title}>{receipt.turnCount} speaking turn{receipt.turnCount === 1 ? "" : "s"} reviewed</Text>
        </View>
        {typeof receipt.pronunciationScore === "number" ? (
          <View style={styles.scorePill}>
            <Text style={styles.score}>{Math.round(receipt.pronunciationScore)}%</Text>
            <Text style={styles.scoreLabel}>voice</Text>
          </View>
        ) : null}
      </View>

      {receipt.bestSentence ? (
        <ReceiptLine icon={<Sparkles color={colors.secondary} size={17} />} label="Best sentence" text={receipt.bestSentence} />
      ) : null}

      {receipt.grammarFix ? (
        <View style={styles.line}>
          <View style={styles.iconSlot}>
            <CheckCircle2 color={colors.success} size={17} />
          </View>
          <View style={styles.lineCopy}>
            <Text style={styles.lineLabel}>Grammar fix</Text>
            {receipt.grammarFix.original ? <Text style={styles.small}>You said: {receipt.grammarFix.original}</Text> : null}
            <Text style={styles.strongText}>{receipt.grammarFix.improved}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.line}>
        <View style={styles.iconSlot}>
          <Repeat2 color={colors.primary} size={17} />
        </View>
        <View style={styles.lineCopy}>
          <Text style={styles.lineLabel}>Practice next</Text>
          <Text style={styles.strongText}>{receipt.retrySentence}</Text>
          {onPracticeSentence ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Practice this sentence"
              onPress={() => onPracticeSentence(receipt.retrySentence)}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
            >
              <Text style={styles.textButtonLabel}>Open speaking practice</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {receipt.nextStepLesson ? (
        <View style={styles.lessonBox}>
          <View style={styles.lessonHeader}>
            <BookOpen color={colors.primary} size={18} />
            <Text style={styles.lessonLabel}>Next lesson</Text>
          </View>
          <Text style={styles.lessonTitle}>{receipt.nextStepLesson.title}</Text>
          <Text style={styles.small}>{receipt.nextStepLesson.reason}</Text>
          {onOpenLesson ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${receipt.nextStepLesson.title}`}
              onPress={() => onOpenLesson(receipt.nextStepLesson!.lessonId)}
              style={({ pressed }) => [styles.lessonButton, pressed && styles.pressed]}
            >
              <Text style={styles.lessonButtonLabel}>Open lesson</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ReceiptLine({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <View style={styles.line}>
      <View style={styles.iconSlot}>{icon}</View>
      <View style={styles.lineCopy}>
        <Text style={styles.lineLabel}>{label}</Text>
        <Text style={styles.strongText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  scorePill: {
    minWidth: 66,
    borderRadius: radii.round,
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  score: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900",
  },
  scoreLabel: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  line: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconSlot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  lineCopy: {
    flex: 1,
    gap: 3,
  },
  lineLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  strongText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  small: {
    color: colors.muted,
    lineHeight: 20,
  },
  textButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  textButtonLabel: {
    color: colors.secondary,
    fontWeight: "900",
  },
  lessonBox: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  lessonLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  lessonTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },
  lessonButton: {
    alignSelf: "flex-start",
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  lessonButtonLabel: {
    color: colors.primary,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
});
