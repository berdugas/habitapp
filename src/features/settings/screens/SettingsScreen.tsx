import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { useAuthSession } from "@/features/auth/hooks";
import { signOut } from "@/features/auth/api";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";

export default function SettingsScreen() {
  const { user } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    router.replace("/");
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <View style={styles.card}>
        <Text selectable style={styles.title}>
          Account
        </Text>
        <Text selectable style={styles.body}>
          {user?.email ?? "Signed in"}
        </Text>
      </View>
      <View style={styles.card}>
        <Text selectable style={styles.title}>
          Foundation status
        </Text>
        <Text selectable style={styles.body}>
          Reminders, reviews, and AI are intentionally left for later phases.
        </Text>
      </View>
      <PrimaryButton
        disabled={isSigningOut}
        label={isSigningOut ? "Signing out..." : "Sign Out"}
        onPress={handleSignOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
});
