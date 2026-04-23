import type { ReactNode } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { shadows } from "@/theme/shadows";
import { spacing } from "@/theme/spacing";

type HabitCardProps = {
  children?: ReactNode;
  formula: string;
  metaText?: string;
  name: string;
  onPress?: () => void;
};

export function HabitCard({
  children,
  formula,
  metaText = "Tracking starts here",
  name,
  onPress,
}: HabitCardProps) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.card}>
      <Text selectable style={styles.name}>
        {name}
      </Text>
      <Text selectable style={styles.formula}>
        {formula}
      </Text>
      {children}
      <View style={styles.metaRow}>
        <Text selectable style={styles.metaText}>
          {metaText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    gap: spacing.md,
    padding: spacing.xl,
  },
  formula: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
  },
  metaText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
});
