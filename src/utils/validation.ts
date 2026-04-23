export function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

export function exceedsLength(
  value: string | null | undefined,
  maxLength: number,
) {
  return (value?.trim().length ?? 0) > maxLength;
}

export function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidTimeString(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}
