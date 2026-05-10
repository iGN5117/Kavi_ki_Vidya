import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { Scenario } from "@/src/types/content";

type ScenarioCardProps = {
  scenario: Scenario;
  onPress: () => void;
};

export function ScenarioCard({ scenario, onPress }: ScenarioCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${scenario.title} roleplay`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>{scenario.icon}</Text>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{scenario.title}</Text>
          <Text style={styles.chip}>{scenario.difficulty}</Text>
        </View>
        <Text style={styles.goal}>{scenario.goal}</Text>
        <Text style={styles.startLine}>Starts with: "{scenario.starter}"</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  pressed: {
    opacity: 0.86,
  },
  icon: {
    fontSize: 28,
    width: 36,
    textAlign: "center",
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  chip: {
    color: colors.secondary,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontWeight: "800",
    fontSize: 12,
  },
  goal: {
    color: colors.muted,
    lineHeight: 20,
  },
  startLine: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
});
