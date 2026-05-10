import { router } from "expo-router";
import { MessageCircle, Radio, Theater } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { CoachAvatar } from "@/src/components/CoachAvatar";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { scenarios } from "@/src/content/scenarios";
import { colors, radii, spacing } from "@/src/theme/theme";

export default function SpeakHome() {
  return (
    <Screen>
      <View style={styles.hero}>
        <CoachAvatar state="neutral" size={146} />
        <Text style={styles.eyebrow}>Speak anytime</Text>
        <Text style={styles.title}>Practice with your coach</Text>
        <Text style={styles.copy}>Speak in Hindi, English, or both. Corrections come mostly after the session.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryActionButton
          label="Live conversation"
          onPress={() => router.push("/speak/live")}
          icon={<Radio color={colors.surface} size={20} />}
        />
        <PrimaryActionButton
          label="Guided roleplay"
          variant="secondary"
          onPress={() => router.push("/speak/roleplay")}
          icon={<Theater color={colors.surface} size={20} />}
        />
        <PrimaryActionButton
          label="Free chat"
          variant="secondary"
          onPress={() => router.push("/speak/conversation?mode=free")}
          icon={<MessageCircle color={colors.surface} size={20} />}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Popular practice</Text>
        {scenarios.slice(0, 3).map((scenario) => (
          <Text key={scenario.id} style={styles.scenarioLine}>
            {scenario.icon} {scenario.title}: {scenario.goal}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
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
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  scenarioLine: {
    color: colors.muted,
    lineHeight: 22,
  },
});
