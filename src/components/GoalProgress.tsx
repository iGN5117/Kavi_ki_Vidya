import { CheckCircle2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";

type GoalProgressProps = {
  minutesToday: number;
  dailyGoalMinutes: number;
  isComplete?: boolean;
  statusLabel?: string;
  nextStep?: string;
};

export function GoalProgress({ minutesToday, dailyGoalMinutes, isComplete, statusLabel, nextStep }: GoalProgressProps) {
  const safeGoal = Math.max(1, dailyGoalMinutes);
  const complete = isComplete ?? minutesToday >= safeGoal;
  const percent = Math.min(1, minutesToday / safeGoal);

  return (
    <View style={[styles.card, complete && styles.completeCard]}>
      <View style={styles.row}>
        <Text style={styles.title}>Today&apos;s goal</Text>
        <View style={styles.valueGroup}>
          {complete ? <CheckCircle2 color={colors.success} size={17} /> : null}
          <Text style={[styles.value, complete && styles.completeValue]}>
            {minutesToday}/{safeGoal} min
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent * 100}%` }]} />
      </View>
      <Text style={[styles.status, complete && styles.completeValue]}>{statusLabel ?? (complete ? "Goal met" : "Keep going")}</Text>
      {nextStep ? <Text style={styles.nextStep}>{nextStep}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completeCard: {
    borderColor: colors.success,
    backgroundColor: colors.secondarySoft,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  valueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  value: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  completeValue: {
    color: colors.success,
  },
  track: {
    height: 10,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.round,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.secondary,
  },
  status: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  nextStep: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
