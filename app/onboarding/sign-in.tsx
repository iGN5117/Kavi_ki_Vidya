import { useState } from "react";
import { Database, UserRound } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { CoachAvatar } from "@/src/components/CoachAvatar";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { getSupabaseConfigStatus } from "@/src/services/supabase/client";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, spacing } from "@/src/theme/theme";

export default function SignInScreen() {
  const signIn = useAppStore((state) => state.signIn);
  const [isContinuing, setContinuing] = useState(false);
  const supabaseStatus = getSupabaseConfigStatus();

  function continueLocally() {
    setContinuing(true);
    signIn({
      provider: "local",
      providerUserId: "kavita-local",
      syncProfileId: "local-kavita",
      displayName: "Kavita",
    });
    router.replace("/onboarding/language");
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <CoachAvatar state="encouraging" size={150} />
        <Text style={styles.brand}>Kavi ki Vidya</Text>
        <Text style={styles.subtitle}>Practice spoken English calmly, a few minutes every day.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryActionButton
          label={isContinuing ? "Continuing..." : "Continue"}
          onPress={continueLocally}
          disabled={isContinuing}
          icon={<UserRound color={colors.surface} />}
        />
        <View style={styles.persistenceCard}>
          <Database color={supabaseStatus.isConfigured ? colors.success : colors.primary} size={22} />
          <View style={styles.persistenceCopy}>
            <Text style={styles.providerStatus}>{supabaseStatus.isConfigured ? "Supabase persistence ready" : "Local persistence ready"}</Text>
            <Text style={styles.providerNote}>
              {supabaseStatus.isConfigured
                ? "Your lessons, streak, review queue, and speaking feedback sync through the Supabase-backed progress table."
                : "Progress stays local until Supabase public config and the API sync endpoint are available."}
            </Text>
          </View>
        </View>
        <Text style={styles.note}>Google and Apple sign-in are intentionally disabled for now. The app uses one local learner profile backed by Supabase persistence.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },
  brand: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
  actions: {
    gap: spacing.md,
  },
  note: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  providerNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  providerStatus: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  persistenceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  persistenceCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});
