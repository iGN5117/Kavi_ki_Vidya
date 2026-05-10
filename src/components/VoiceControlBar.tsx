import { Keyboard as KeyboardIcon, Mic, Pause, Send, Square } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";

type VoiceControlBarProps = {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDurationMillis: number;
  micHelpText?: string | null;
  onRecord: () => void;
  onStop: () => void;
  onEnd: () => void;
  onTryTyping?: () => void;
};

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoiceControlBar({
  isRecording,
  isProcessing,
  recordingDurationMillis,
  micHelpText,
  onRecord,
  onStop,
  onEnd,
  onTryTyping,
}: VoiceControlBarProps) {
  const hasRetryHelp = Boolean(micHelpText) && !isRecording && !isProcessing;
  const micLabel = isRecording ? "Stop recording" : isProcessing ? "Processing voice turn" : "Start recording";
  const statusTitle = hasRetryHelp
    ? "Voice needs another try"
    : isRecording
      ? `Recording ${formatDuration(recordingDurationMillis)}`
      : isProcessing
        ? "Processing voice"
        : "Ready to speak";
  const statusSub = isRecording
    ? "When you finish, tap stop."
    : isProcessing
      ? "Converting your recording and getting a reply."
      : micHelpText ?? "Tap the mic and speak naturally. Hindi, English, or both are okay.";
  const stateLabel = hasRetryHelp ? "Retry" : isRecording ? "Recording" : isProcessing ? "Processing" : "Ready";

  return (
    <View style={[styles.bar, isRecording && styles.recordingBar, hasRetryHelp && styles.retryBar]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={micLabel}
        onPress={isRecording ? onStop : onRecord}
        disabled={isProcessing}
        style={[styles.micButton, isRecording && styles.recordingButton, isProcessing && styles.disabled]}
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.surface} />
        ) : isRecording ? (
          <Square color={colors.surface} size={24} />
        ) : (
          <Mic color={colors.surface} size={26} />
        )}
      </Pressable>
      <View style={styles.status}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>{statusTitle}</Text>
          <View
            style={[
              styles.statePill,
              isRecording && styles.statePillRecording,
              isProcessing && styles.statePillProcessing,
              hasRetryHelp && styles.statePillRetry,
            ]}
          >
            <Text
              style={[
                styles.statePillText,
                isRecording && styles.statePillTextActive,
                isProcessing && styles.statePillTextActive,
                hasRetryHelp && styles.statePillTextRetry,
              ]}
            >
              {stateLabel}
            </Text>
          </View>
        </View>
        <Text style={[styles.statusSub, micHelpText && !isRecording && styles.helpText]}>{statusSub}</Text>
        {hasRetryHelp && onTryTyping ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try typing instead"
            onPress={onTryTyping}
            style={styles.typingButton}
          >
            <KeyboardIcon color={colors.primary} size={16} />
            <Text style={styles.typingButtonText}>Try typing instead</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isProcessing ? "Coach is thinking" : "End session"}
        onPress={onEnd}
        disabled={isProcessing}
        style={[styles.endButton, isProcessing && styles.endButtonDisabled]}
      >
        {isProcessing ? <Pause color={colors.muted} size={20} /> : <Send color={colors.primary} size={20} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  recordingBar: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  retryBar: {
    borderColor: colors.danger,
  },
  micButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  recordingButton: {
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  status: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  statusTitle: {
    color: colors.ink,
    fontWeight: "900",
    flexShrink: 1,
  },
  statusSub: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  helpText: {
    color: colors.danger,
    fontWeight: "700",
  },
  statePill: {
    borderRadius: radii.round,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statePillRecording: {
    backgroundColor: colors.primary,
  },
  statePillProcessing: {
    backgroundColor: colors.secondary,
  },
  statePillRetry: {
    backgroundColor: colors.surfaceWarm,
  },
  statePillText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  statePillTextActive: {
    color: colors.surface,
  },
  statePillTextRetry: {
    color: colors.danger,
  },
  typingButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: 2,
  },
  typingButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  endButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  endButtonDisabled: {
    opacity: 0.55,
  },
});
