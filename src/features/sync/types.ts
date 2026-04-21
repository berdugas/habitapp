export type SyncMutationType =
  | "update_habit"
  | "upsert_habit_context"
  | "upsert_daily_log"
  | "archive_habit";

export type SyncQueueItem = {
  createdAt: string;
  id: string;
  lastError: string | null;
  payload: Record<string, unknown>;
  retryCount: number;
  type: SyncMutationType;
};
