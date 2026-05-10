import { Stack } from "expo-router";
import { colors } from "@/src/theme/theme";

export default function LearnLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="module/[moduleId]" options={{ title: "Module" }} />
      <Stack.Screen name="lesson/[lessonId]" options={{ title: "Lesson" }} />
    </Stack>
  );
}
