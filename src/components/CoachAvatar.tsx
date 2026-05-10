import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { CoachState } from "@/src/types/speaking";

const sprite = require("../../assets/avatars/coach-sprite.png");

const stateIndex: Record<CoachState, number> = {
  neutral: 0,
  listening: 1,
  speaking: 2,
  encouraging: 3,
  thinking: 4,
};

const statusLabel: Record<CoachState, string> = {
  neutral: "Ready",
  listening: "Listening",
  speaking: "Speaking",
  encouraging: "Great effort",
  thinking: "Thinking",
};

type CoachAvatarProps = {
  state?: CoachState;
  size?: number;
};

export function CoachAvatar({ state = "neutral", size = 132 }: CoachAvatarProps) {
  const imageWidth = size * 5;
  const imageHeight = size * 1.67;

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={sprite}
          resizeMode="cover"
          style={[
            styles.sprite,
            {
              width: imageWidth,
              height: imageHeight,
              transform: [{ translateX: -stateIndex[state] * size }, { translateY: -size * 0.14 }],
            },
          ]}
        />
      </View>
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, state === "listening" && styles.listeningDot]} />
        <Text style={styles.statusText}>{statusLabel[state]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
  },
  frame: {
    overflow: "hidden",
    backgroundColor: colors.surfaceWarm,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  sprite: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  statusPill: {
    backgroundColor: colors.surface,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  listeningDot: {
    backgroundColor: colors.accent,
  },
  statusText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
});
