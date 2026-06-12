import type { PropsWithChildren } from "react";
import type { Edge } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/src/theme/theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  testID?: string;
}>;

export function Screen({ children, scroll = true, edges = ["top", "right", "bottom", "left"], testID }: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView testID={testID} collapsable={false} edges={edges} style={styles.container}>
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID={testID} collapsable={false} edges={edges} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.container}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
