import { Stack } from "expo-router";
import { colors } from "@/src/theme/theme";

export default function SpeakLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="live" options={{ title: "Live conversation" }} />
      <Stack.Screen name="roleplay" options={{ title: "Choose roleplay" }} />
      <Stack.Screen name="conversation" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ title: "Feedback" }} />
    </Stack>
  );
}
