import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/src/theme/theme";
import { PrimaryActionButton } from "./PrimaryActionButton";

type SkipConfirmationSheetProps = {
  visible: boolean;
  title: string;
  overview: string[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function SkipConfirmationSheet({ visible, title, overview, onCancel, onConfirm }: SkipConfirmationSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet}>
          <Text style={styles.eyebrow}>Before you skip</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.copy}>You&apos;ll skip:</Text>
          {overview.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
          <Text style={styles.reassurance}>You can come back anytime.</Text>
          <View style={styles.actions}>
            <PrimaryActionButton label="Keep learning" variant="ghost" onPress={onCancel} />
            <PrimaryActionButton label="Skip for now" onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(36, 33, 31, 0.34)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    fontWeight: "800",
  },
  bullet: {
    color: colors.ink,
    lineHeight: 22,
  },
  reassurance: {
    color: colors.secondary,
    fontWeight: "800",
  },
  actions: {
    gap: spacing.sm,
  },
});
