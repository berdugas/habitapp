import { loadSyncQueue, saveSyncQueue } from "@/features/sync/storage";

import type { SyncQueueItem } from "@/features/sync/types";

export async function listQueuedMutations() {
  return loadSyncQueue();
}

export async function enqueueMutation(item: SyncQueueItem) {
  const items = await loadSyncQueue();
  const nextItems = [...items, item];
  await saveSyncQueue(nextItems);
  return nextItems;
}

export async function replaceQueuedMutations(items: SyncQueueItem[]) {
  await saveSyncQueue(items);
  return items;
}

export async function removeQueuedMutation(id: string) {
  const items = await loadSyncQueue();
  const nextItems = items.filter((item) => item.id !== id);
  await saveSyncQueue(nextItems);
  return nextItems;
}
