import { CircleAlert, CircleCheck, Flame } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { StreakStatus } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";

type StreakProgressProps = {
  streakCount: number;
  status?: StreakStatus;
  compact?: boolean;
  testID?: string;
};

export function StreakProgress({ streakCount, status, compact = true, testID }: StreakProgressProps) {
  const countLabel = `${streakCount || 0} day${streakCount === 1 ? "" : "s"} streak`;
  const label = status ? `${countLabel} · ${status.label}` : countLabel;
  const detail = status?.detail;
  const color = status?.key === "missed" ? colors.danger : status?.key === "today-done" ? colors.success : colors.primary;
  const Icon = status?.key === "missed" ? CircleAlert : status?.key === "today-done" ? CircleCheck : Flame;

  return (
    <View testID={testID} style={[styles.pill, compact && styles.compactPill, !compact && styles.card, status?.key === "missed" && styles.missed]}>
      <Icon color={color} size={18} />
      <View style={styles.copy}>
        <Text style={[styles.text, { color }]}>{label}</Text>
        {!compact && detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compactPill: {
    maxWidth: "62%",
  },
  card: {
    alignItems: "flex-start",
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  missed: {
    borderColor: colors.danger,
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: spacing.xs,
  },
  text: {
    color: colors.primaryDark,
    fontWeight: "800",
    flexShrink: 1,
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
