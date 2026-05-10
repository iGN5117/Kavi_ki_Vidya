import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/src/components/Screen";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { ExplanationPreference } from "@/src/types/content";

const options: Array<{ value: ExplanationPreference; title: string; subtitle: string }> = [
  { value: "hi-Deva", title: "Hindi", subtitle: "मुझे हिंदी में अर्थ चाहिए।" },
  { value: "hi-Latn", title: "Hinglish", subtitle: "Mujhe Hinglish mein meaning chahiye." },
  { value: "both", title: "Both", subtitle: "Show Hindi and Hinglish together." },
];

export default function LanguageScreen() {
  const preference = useAppStore((state) => state.explanationPreference);
  const setPreference = useAppStore((state) => state.setExplanationPreference);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>How should meanings appear?</Text>
        <Text style={styles.copy}>You can change this later in Profile.</Text>
      </View>
      {options.map((option) => {
        const selected = option.value === preference;
        return (
          <Pressable
            key={option.value}
            onPress={() => setPreference(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push("/onboarding/daily-goal")} style={styles.next}>
        <Text style={styles.nextText}>Continue</Text>
      </Pressable>
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
  option: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  optionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  optionSubtitle: {
    color: colors.muted,
    lineHeight: 21,
  },
  next: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 16,
  },
});
