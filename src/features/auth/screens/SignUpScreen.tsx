import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TextField } from "@/components/forms/TextField";
import { signUpWithPassword } from "@/features/auth/api";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const { data, error: authError } = await signUpWithPassword(
      email.trim(),
      password,
    );

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      router.replace("/");
      return;
    }

    setError(
      "Sign-up did not return a session. For MVP testing, Supabase email confirmation must be OFF. Verify the hosted Supabase auth setting and try again.",
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Create your account
        </Text>
        <Text selectable style={styles.body}>
          We will use this foundation to create your first habit and land you in
          Today.
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
          placeholder="Choose a password"
          secureTextEntry
          value={password}
        />
        <PrimaryButton
          disabled={isSubmitting}
          label={isSubmitting ? "Creating account..." : "Sign Up"}
          onPress={handleSubmit}
        />
        <SecondaryButton
          label="I already have an account"
          onPress={() => router.push("/(auth)/sign-in")}
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
