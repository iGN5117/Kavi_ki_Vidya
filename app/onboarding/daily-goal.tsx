import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";

const goals = [5, 10, 15];

export default function DailyGoalScreen() {
  const dailyGoalMinutes = useAppStore((state) => state.dailyGoalMinutes);
  const setDailyGoalMinutes = useAppStore((state) => state.setDailyGoalMinutes);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  function finish() {
    completeOnboarding();
    router.replace("/speak");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a tiny daily goal</Text>
        <Text style={styles.copy}>Small practice every day builds speaking confidence.</Text>
      </View>
      <View style={styles.goalRow}>
        {goals.map((goal) => (
          <Pressable
            key={goal}
            onPress={() => setDailyGoalMinutes(goal)}
            style={[styles.goal, dailyGoalMinutes === goal && styles.selectedGoal]}
          >
            <Text style={styles.goalValue}>{goal}</Text>
            <Text style={styles.goalLabel}>minutes</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryActionButton label="Start speaking" onPress={finish} />
    </Screen>
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
    fontSize: 16,
  },
  goalRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  goal: {
    flex: 1,
    minHeight: 108,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  selectedGoal: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  goalValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
  },
  goalLabel: {
    color: colors.muted,
    fontWeight: "800",
  },
});
