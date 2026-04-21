import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { shadows } from "@/theme/shadows";
import { spacing } from "@/theme/spacing";

type PrimaryButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function PrimaryButton({
  disabled = false,
  label,
  onPress,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text selectable style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    boxShadow: shadows.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
