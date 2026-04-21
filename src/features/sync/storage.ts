import { getStoredJson, removeStoredItem, setStoredJson } from "@/lib/storage";
import { storageKeys } from "@/lib/storage/keys";

import type { SyncQueueItem } from "@/features/sync/types";

export async function loadSyncQueue() {
  return getStoredJson<SyncQueueItem[]>(storageKeys.syncQueue, []);
}

export async function saveSyncQueue(items: SyncQueueItem[]) {
  await setStoredJson(storageKeys.syncQueue, items);
}

export async function clearSyncQueue() {
  await removeStoredItem(storageKeys.syncQueue);
}
