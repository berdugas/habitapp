export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (__DEV__) {
    console.info(`[analytics] ${eventName}`, properties ?? {});
  }
}
