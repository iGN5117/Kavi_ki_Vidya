import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { ExplanationPreference, LocalizedSupport } from "@/src/types/content";

type MeaningPanelProps = {
  support: LocalizedSupport;
  preference: ExplanationPreference;
  visible: boolean;
  onToggle: () => void;
};

export function MeaningPanel({ support, preference, visible, onToggle }: MeaningPanelProps) {
  const showHindi = preference === "hi-Deva" || preference === "both";
  const showHinglish = preference === "hi-Latn" || preference === "both";

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={styles.button}>
        <Text style={styles.buttonText}>{visible ? "Hide meaning" : "Meaning"}</Text>
      </Pressable>
      {visible ? (
        <View style={styles.panel}>
          {showHindi && support["hi-Deva"] ? <Text style={styles.meaning}>{support["hi-Deva"]}</Text> : null}
          {showHinglish && support["hi-Latn"] ? <Text style={styles.hinglish}>{support["hi-Latn"]}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  button: {
    alignSelf: "flex-start",
    borderRadius: radii.round,
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.secondary,
    fontWeight: "900",
  },
  panel: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  meaning: {
    color: colors.ink,
    fontSize: 17,
    lineHeight: 25,
  },
  hinglish: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
