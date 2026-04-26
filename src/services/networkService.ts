import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService } from './syncService';

export type QueuedRequest = {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
};

class NetworkService {
  private isOnline: boolean = true;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private readonly QUEUE_KEY = '@offline_request_queue';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? true;

    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? true;

      if (!wasOnline && this.isOnline) {
        // Just came back online
        this.notifyListeners(true);
        this.processQueue();
        // Trigger sync service to sync local changes
        syncService.syncNow();
      } else if (wasOnline && !this.isOnline) {
        // Just went offline
        this.notifyListeners(false);
      }
    });
  }

  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  async addToQueue(request: QueuedRequest) {
    const queue = await this.getQueue();
    queue.push(request);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  async getQueue(): Promise<QueuedRequest[]> {
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  }

  async clearQueue() {
    await AsyncStorage.removeItem(this.QUEUE_KEY);
  }

  async processQueue() {
    if (!this.isOnline) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued requests...`);

    const failedRequests: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        console.log(`Successfully processed queued request: ${request.method} ${request.url}`);
      } catch (error) {
        console.error(`Failed to process queued request: ${request.method} ${request.url}`, error);
        failedRequests.push(request);
      }
    }

    // Update queue with only failed requests
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(failedRequests));

    if (failedRequests.length === 0) {
      await this.clearQueue();
    } else {
      console.log(`${failedRequests.length} requests still failed after retry`);
    }
  }
}

export const networkService = new NetworkService();
