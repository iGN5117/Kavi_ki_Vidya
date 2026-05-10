import type { ReactNode } from "react";
import { BookmarkCheck, BookmarkPlus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { SpeakingFeedback } from "@/src/types/speaking";

type FeedbackSummaryProps = {
  feedback: SpeakingFeedback;
  savedPhrases?: string[];
  onSavePhrase?: (phrase: string) => void;
};

export function FeedbackSummary({ feedback, savedPhrases = [], onSavePhrase }: FeedbackSummaryProps) {
  const savedPhraseSet = new Set(savedPhrases);
  const pronunciationScore =
    typeof feedback.pronunciation.score === "number"
      ? Math.max(0, Math.min(100, feedback.pronunciation.score <= 1 ? feedback.pronunciation.score * 100 : feedback.pronunciation.score))
      : undefined;
  const confidenceScore =
    typeof feedback.confidence.score === "number"
      ? Math.max(0, Math.min(100, feedback.confidence.score <= 1 ? feedback.confidence.score * 100 : feedback.confidence.score))
      : undefined;

  return (
    <View style={styles.wrap}>
      <Section title="Pronunciation">
        {typeof pronunciationScore === "number" ? (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>{Math.round(pronunciationScore)}%</Text>
            <View style={styles.scoreTrack}>
              <View style={[styles.pronunciationScoreFill, { width: `${pronunciationScore}%` }]} />
            </View>
          </View>
        ) : null}
        <Text style={styles.copy}>{feedback.pronunciation.summary}</Text>
        {feedback.pronunciation.tips?.length ? (
          <View style={styles.retryBlock}>
            <Text style={styles.eyebrow}>Tips</Text>
            {feedback.pronunciation.tips.map((tip, index) => (
              <Text key={`${tip}-${index}`} style={styles.small}>
                {tip}
              </Text>
            ))}
          </View>
        ) : null}
        {feedback.pronunciation.retryWords.length ? (
          <View style={styles.retryBlock}>
            <Text style={styles.eyebrow}>Try again</Text>
            <View style={styles.chips}>
              {feedback.pronunciation.retryWords.map((word, index) => (
                <View key={`${word}-${index}`} style={styles.retryChip}>
                  <Text style={styles.retryText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Section>
      <Section title="Grammar">
        {feedback.grammar.improvedSentences.length ? (
          feedback.grammar.improvedSentences.map((item) => (
            <View key={`${item.original ?? "grammar"}-${item.improved}`} style={styles.correction}>
              {item.original ? (
                <LabeledLine label="You said" text={item.original} tone="muted" />
              ) : null}
              <LabeledLine label="Try" text={item.improved} tone="strong" />
              {item.explanation["hi-Deva"] ? <Text style={styles.small}>{item.explanation["hi-Deva"]}</Text> : null}
              {item.explanation["hi-Latn"] ? <Text style={styles.small}>{item.explanation["hi-Latn"]}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.copy}>Your sentences were easy to understand.</Text>
        )}
      </Section>
      <Section title="Confidence">
        {typeof confidenceScore === "number" ? (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>{Math.round(confidenceScore)}%</Text>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: `${confidenceScore}%` }]} />
            </View>
          </View>
        ) : null}
        <Text style={styles.copy}>{feedback.confidence.note}</Text>
        <Text style={styles.small}>{feedback.confidence.nextStep}</Text>
      </Section>
      {feedback.savedPhrases.length ? (
        <Section title="Saved phrases">
          <View style={styles.phraseList}>
            {feedback.savedPhrases.map((phrase, index) => {
              const isSaved = savedPhraseSet.has(phrase);
              return (
                <View key={`${phrase}-${index}`} style={styles.phraseRow}>
                  <Text style={styles.phraseText}>{phrase}</Text>
                  {onSavePhrase ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={isSaved ? "Phrase saved" : "Save phrase"}
                      onPress={() => onSavePhrase(phrase)}
                      disabled={isSaved}
                      style={({ pressed }) => [
                        styles.saveButton,
                        isSaved && styles.saveButtonSaved,
                        pressed && !isSaved && styles.saveButtonPressed,
                      ]}
                    >
                      {isSaved ? (
                        <BookmarkCheck color={colors.success} size={16} />
                      ) : (
                        <BookmarkPlus color={colors.secondary} size={16} />
                      )}
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}
      {feedback.mistakes.length ? (
        <Section title="Remember">
          {feedback.mistakes.map((mistake, index) => (
            <Text key={`${mistake}-${index}`} style={styles.small}>
              {mistake}
            </Text>
          ))}
        </Section>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

function LabeledLine({ label, text, tone }: { label: string; text: string; tone: "muted" | "strong" }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineText, tone === "muted" ? styles.lineTextMuted : styles.lineTextStrong]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  copy: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 23,
  },
  small: {
    color: colors.muted,
    lineHeight: 21,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  retryBlock: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  retryChip: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  correction: {
    gap: spacing.xs,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  line: {
    gap: 2,
  },
  lineLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  lineText: {
    fontSize: 16,
    lineHeight: 23,
  },
  lineTextMuted: {
    color: colors.muted,
  },
  lineTextStrong: {
    color: colors.ink,
    fontWeight: "900",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scoreText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900",
    minWidth: 48,
  },
  scoreTrack: {
    flex: 1,
    height: 10,
    borderRadius: radii.round,
    backgroundColor: colors.surfaceWarm,
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    borderRadius: radii.round,
    backgroundColor: colors.success,
  },
  pronunciationScoreFill: {
    height: "100%",
    borderRadius: radii.round,
    backgroundColor: colors.secondary,
  },
  phraseList: {
    gap: spacing.sm,
  },
  phraseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  phraseText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  saveButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondarySoft,
  },
  saveButtonPressed: {
    opacity: 0.72,
  },
  saveButtonSaved: {
    backgroundColor: colors.surfaceWarm,
  },
});
