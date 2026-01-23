/**
 * Offline Context
 * Provides global offline state and sync functionality
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import useNetworkStatus from '../hooks/useNetworkStatus';
import {
  syncManager,
  SyncResult,
  SyncProgress,
} from '../services/offline/SyncManager';
import { offlineStorage } from '../services/offline/OfflineStorageSQLite';

interface OfflineContextType {
  // Network state
  isOnline: boolean;
  isOfflineMode: boolean;

  // Sync state
  isSyncing: boolean;
  pendingSalesCount: number;
  lastSyncTime: string | null;
  syncProgress: SyncProgress | null;

  // Actions
  triggerSync: () => Promise<SyncResult>;
  refreshSyncStatus: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const { isOnline: networkOnline, isInternetReachable } = useNetworkStatus();

  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  // Determine if truly online (connected + internet reachable)
  const isOnline = networkOnline && isInternetReachable !== false;
  const isOfflineMode = !isOnline;

  // Refresh sync status
  const refreshSyncStatus = useCallback(async () => {
    const status = await syncManager.getSyncStatus();
    setPendingSalesCount(status.pendingSales);
    setLastSyncTime(status.lastSyncTime);
    setIsSyncing(status.isSyncing);
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Device is offline'],
      };
    }

    const result = await syncManager.syncAll();
    await refreshSyncStatus();
    return result;
  }, [isOnline, refreshSyncStatus]);

  // Listen to sync state changes
  useEffect(() => {
    const unsubscribeSyncState = syncManager.addSyncListener(syncing => {
      setIsSyncing(syncing);
    });

    const unsubscribeProgress = syncManager.addProgressListener(progress => {
      setSyncProgress(progress);
    });

    return () => {
      unsubscribeSyncState();
      unsubscribeProgress();
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOfflineMode) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Just came back online, trigger sync
      console.log('Connection restored - triggering auto-sync');
      setWasOffline(false);

      // Small delay to ensure network is stable
      const syncTimeout = setTimeout(async () => {
        const pendingCount = await offlineStorage.getPendingSalesCount();
        if (pendingCount > 0) {
          triggerSync();
        }
      }, 2000);

      return () => clearTimeout(syncTimeout);
    }
  }, [isOnline, isOfflineMode, wasOffline, triggerSync]);

  // Refresh status on mount and when app becomes active
  useEffect(() => {
    refreshSyncStatus();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshSyncStatus();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [refreshSyncStatus]);

  // Periodically check for pending items
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSyncStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refreshSyncStatus]);

  const value: OfflineContextType = {
    isOnline,
    isOfflineMode,
    isSyncing,
    pendingSalesCount,
    lastSyncTime,
    syncProgress,
    triggerSync,
    refreshSyncStatus,
  };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

export default OfflineContext;
