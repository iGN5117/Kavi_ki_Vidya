import { CheckCircle2, Circle, SkipForward } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";

type LessonCardProps = {
  title: string;
  overview: string;
  status?: "ready" | "completed" | "skipped";
  onPress: () => void;
};

export function LessonCard({ title, overview, status = "ready", onPress }: LessonCardProps) {
  const icon =
    status === "completed" ? (
      <CheckCircle2 color={colors.success} size={22} />
    ) : status === "skipped" ? (
      <SkipForward color={colors.muted} size={22} />
    ) : (
      <Circle color={colors.primary} size={22} />
    );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {icon}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.overview}>{overview}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  pressed: {
    opacity: 0.84,
  },
  textWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  overview: {
    color: colors.muted,
    lineHeight: 21,
  },
});
