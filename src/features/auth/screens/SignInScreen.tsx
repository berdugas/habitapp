import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TextField } from "@/components/forms/TextField";
import { signInWithPassword } from "@/features/auth/api";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const { error: authError } = await signInWithPassword(email.trim(), password);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace("/");
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Welcome back
        </Text>
        <Text selectable style={styles.body}>
          Sign in to keep working on your habit foundation.
        </Text>
      </View>

      <View style={styles.formCard}>
        {error ? <ErrorState message={error} /> : null}
        <TextField
          autoCapitalize="none"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        <TextField
          autoCapitalize="none"
          label="Password"
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          value={password}
        />
        <PrimaryButton
          disabled={isSubmitting}
          label={isSubmitting ? "Signing in..." : "Sign In"}
          onPress={handleSubmit}
        />
        <SecondaryButton
          label="Create an account"
          onPress={() => router.push("/(auth)/sign-up")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  copy: {
    gap: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
});
