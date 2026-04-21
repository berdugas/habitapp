export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[habits] ${message}`, meta ?? {});
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[habits] ${message}`, meta ?? {});
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[habits] ${message}`, meta ?? {});
  },
};
