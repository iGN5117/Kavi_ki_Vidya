import type { ViewStyle } from "react-native";
import { colors } from "@/src/theme/theme";

export function getTabBarStyle(bottomInset: number): ViewStyle {
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 60 + bottomInset,
    minHeight: 68,
    paddingTop: 8,
    paddingBottom: bottomInset,
  };
}
