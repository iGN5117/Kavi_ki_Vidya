import { Volume2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getLocalizedSupportLines, getPronunciationSupport } from "@/src/services/i18n/languageSupport";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { ExplanationPreference } from "@/src/types/content";
import type { ConversationTurn } from "@/src/types/speaking";

type ConversationBubbleProps = {
  turn: ConversationTurn;
  preference: ExplanationPreference;
  onReplayAudio?: (audioUrl: string) => void;
  testID?: string;
};

export function ConversationBubble({ turn, preference, onReplayAudio, testID }: ConversationBubbleProps) {
  const isUser = turn.speaker === "user";
  const replayAudioUrl = !isUser ? turn.audioUrl : undefined;
  const canReplay = Boolean(replayAudioUrl && onReplayAudio);
  const modelSentence = turn.pronunciation ? getModelSentence(turn.pronunciation) : undefined;
  const primaryTip = turn.pronunciation?.tips?.[0];
  const supportLines = getLocalizedSupportLines(turn.support, preference, turn.supportText);
  const pronunciationSupportLines = turn.pronunciation
    ? getLocalizedSupportLines(getPronunciationSupport(turn.pronunciation), preference)
    : [];

  return (
    <View testID={testID} collapsable={false} style={styles.turnGroup}>
      <View style={[styles.bubble, isUser ? styles.user : styles.coach, canReplay && styles.coachWithReplay]}>
        {canReplay && replayAudioUrl ? (
          <Pressable
            testID="conversation-replay-audio-button"
            accessibilityRole="button"
            accessibilityLabel="Replay coach audio"
            onPress={() => onReplayAudio?.(replayAudioUrl)}
            style={({ pressed }) => [styles.replayButton, pressed && styles.replayButtonPressed]}
          >
            <Volume2 color={colors.secondary} size={18} />
          </Pressable>
        ) : null}
        {turn.label ? <Text style={[styles.label, isUser ? styles.userLabel : styles.coachLabel]}>{turn.label}</Text> : null}
        <Text style={[styles.text, isUser ? styles.userText : styles.coachText]}>{turn.text}</Text>
        {supportLines.map((line) => (
          <Text key={line} style={styles.supportText}>
            {line}
          </Text>
        ))}
      </View>
      {isUser && turn.pronunciation ? (
        <View style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentHeading}>
              <Text style={styles.assessmentTitle}>Pronunciation</Text>
              <Text style={styles.assessmentMeta}>
                {getVerdictLabel(turn.pronunciation.verdict)} - {turn.pronunciation.scoringMode === "audio" ? "Audio score" : "Transcript score"}
              </Text>
            </View>
            <Text style={styles.pronunciationScore}>{Math.round(turn.pronunciation.score)}%</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${Math.max(6, Math.min(100, Math.round(turn.pronunciation.score)))}%` }]} />
          </View>
          {modelSentence ? (
            <View style={styles.modelSentenceBlock}>
              <Text style={styles.modelSentenceLabel}>Better way</Text>
              <Text style={styles.modelSentenceText}>{modelSentence}</Text>
            </View>
          ) : null}
          <Text style={styles.pronunciationCopy}>{turn.pronunciation.summary}</Text>
          {pronunciationSupportLines.map((line) => (
            <Text key={line} style={styles.pronunciationSupportText}>
              {line}
            </Text>
          ))}
          {primaryTip ? <Text style={styles.pronunciationTip}>{primaryTip}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function getVerdictLabel(verdict: NonNullable<ConversationTurn["pronunciation"]>["verdict"]) {
  if (verdict === "clear") return "Clear";
  if (verdict === "practice-again") return "Practice again";
  return "Try again";
}

function normalizeSpeechText(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getModelSentence(pronunciation: NonNullable<ConversationTurn["pronunciation"]>) {
  const modelSentence = pronunciation.modelSentence?.trim();
  if (!modelSentence) return undefined;

  const normalizedModel = normalizeSpeechText(modelSentence);
  const normalizedTranscript = normalizeSpeechText(pronunciation.transcript);

  if (!normalizedModel || normalizedModel === normalizedTranscript) {
    return undefined;
  }

  return modelSentence;
}

const styles = StyleSheet.create({
  turnGroup: {
    width: "100%",
    gap: spacing.xs,
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  coachWithReplay: {
    paddingRight: spacing.xxl + spacing.md,
  },
  coach: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: colors.secondary,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  coachLabel: {
    color: colors.primary,
  },
  userLabel: {
    color: colors.surface,
    opacity: 0.85,
  },
  coachText: {
    color: colors.ink,
  },
  userText: {
    color: colors.surface,
  },
  supportText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  assessmentCard: {
    alignSelf: "flex-end",
    width: "88%",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  assessmentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  assessmentHeading: {
    flex: 1,
    gap: 2,
  },
  assessmentTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  assessmentMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  pronunciationScore: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  scoreTrack: {
    height: 8,
    borderRadius: radii.round,
    overflow: "hidden",
    backgroundColor: colors.surfaceWarm,
  },
  scoreFill: {
    height: "100%",
    borderRadius: radii.round,
    backgroundColor: colors.secondary,
  },
  modelSentenceBlock: {
    borderRadius: radii.sm,
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  modelSentenceLabel: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modelSentenceText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  pronunciationCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pronunciationSupportText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pronunciationTip: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  replayButton: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radii.round,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  replayButtonPressed: {
    opacity: 0.72,
  },
});
