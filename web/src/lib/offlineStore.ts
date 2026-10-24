import { get, set, keys, delMany } from 'idb-keyval';

export type QueuedWrite = {
  id: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  url: string;
  params?: unknown;
  data?: string;
  createdAt: number;
};

const CACHE_PREFIX = 'api-cache:';
const QUEUE_KEY = 'sync-queue';
export const QUEUE_CHANGE_EVENT = 'sync-queue-change';

export const cacheKey = (url?: string, params?: unknown) =>
  `${CACHE_PREFIX}${url}?${JSON.stringify(params ?? {})}`;

export const getCached = (key: string) => get<unknown>(key);

export const setCached = (key: string, data: unknown) => set(key, data);

export async function clearCache() {
  const allKeys = await keys();
  await delMany(allKeys.filter(key => String(key).startsWith(CACHE_PREFIX)));
}

export const getQueue = async () => (await get<QueuedWrite[]>(QUEUE_KEY)) ?? [];

export async function setQueue(queue: QueuedWrite[]) {
  await set(QUEUE_KEY, queue);
  window.dispatchEvent(new Event(QUEUE_CHANGE_EVENT));
}

export async function enqueue(write: Omit<QueuedWrite, 'id' | 'createdAt'>) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  await setQueue([...(await getQueue()), { ...write, id, createdAt: Date.now() }]);
}
