import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ScenarioCard } from "@/src/components/ScenarioCard";
import { Screen } from "@/src/components/Screen";
import { scenarios } from "@/src/content/scenarios";
import { colors, spacing } from "@/src/theme/theme";
import type { Scenario } from "@/src/types/content";

const sections: { title: string; copy: string; scenarioIds: string[] }[] = [
  {
    title: "Home and family",
    copy: "Warm, simple English for daily home moments.",
    scenarioIds: ["guest-at-home", "family-routine", "home-help", "small-talk"],
  },
  {
    title: "Children and school",
    copy: "Practice talking with a child or teacher with confidence.",
    scenarioIds: ["child-homework", "parent-teacher"],
  },
  {
    title: "Outside work",
    copy: "Useful lines for shops, travel, calls, and appointments.",
    scenarioIds: [
      "shopping",
      "clinic-chemist",
      "society-office",
      "bank-atm",
      "repair-service",
      "travel",
      "customer-service",
      "office-call",
      "interview",
      "introductions",
    ],
  },
];

export default function RoleplayScreen() {
  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

  function openScenario(scenario: Scenario) {
    router.push({
      pathname: "/speak/conversation",
      params: {
        mode: "roleplay",
        scenarioId: scenario.id,
      },
    });
  }

  return (
    <Screen testID="roleplay-screen">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Guided roleplay</Text>
        <Text style={styles.title}>Practice real situations</Text>
        <Text style={styles.copy}>
          Pick an everyday moment. Your coach will start the conversation, show a clear goal, and offer simple English lines.
        </Text>
      </View>
      {sections.map((section) => {
        const sectionScenarios = section.scenarioIds
          .map((id) => scenarioById.get(id))
          .filter((scenario): scenario is Scenario => Boolean(scenario));

        return (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCopy}>{section.copy}</Text>
            </View>
            {sectionScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                testID={`roleplay-scenario-${scenario.id}`}
                scenario={scenario}
                onPress={() => openScenario(scenario)}
              />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
  },
  sectionCopy: {
    color: colors.muted,
    lineHeight: 20,
  },
});
