import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { QUEUE_CHANGE_EVENT, getQueue, setQueue } from './offlineStore';

let flushing = false;

// Network failures, server errors and auth/rate-limit responses are retried later; other 4xx responses are dropped
const isRetriable = (error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return !status || status >= 500 || [401, 408, 429].includes(status);
};

export async function flushQueue() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    for (;;) {
      const [write] = await getQueue();
      if (!write) break;
      try {
        await apiClient.request({
          method: write.method,
          url: write.url,
          params: write.params,
          data: write.data,
          offlineReplay: true,
        });
      } catch (error) {
        if (isRetriable(error)) break;
        console.error('Dropping queued change rejected by the server', write, error);
        toast.error(`A queued ${write.method.toUpperCase()} change was rejected by the server`);
      }
      await setQueue((await getQueue()).filter(w => w.id !== write.id));
    }
  } finally {
    flushing = false;
  }
}

export function initOfflineSync() {
  window.addEventListener('online', () => void flushQueue());
  void flushQueue();
}

export function usePendingSync() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => void getQueue().then(queue => setPending(queue.length));
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    refresh();
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener(QUEUE_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener(QUEUE_CHANGE_EVENT, refresh);
    };
  }, []);

  return { online, pending };
}
