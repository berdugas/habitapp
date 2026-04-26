export const HABIT_FORMULA_PLACEHOLDER =
  "After I [stack trigger], I will [tiny action].";

export function stripLeadingAfter(value: string) {
  return value.trim().replace(/^after\s+/i, "").trim();
}

export function formatHabitFormula(stackTrigger: string, tinyAction: string) {
  const cleanTrigger = stripLeadingAfter(stackTrigger);
  const cleanAction = tinyAction.trim();

  if (!cleanTrigger || !cleanAction) {
    return HABIT_FORMULA_PLACEHOLDER;
  }

  return `After ${cleanTrigger}, I will ${cleanAction}.`;
}
