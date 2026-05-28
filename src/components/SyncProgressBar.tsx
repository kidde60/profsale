import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { syncService } from '../services/syncService';
import { networkService } from '../services/networkService';

const COLORS = {
  background: '#fff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#007AFF',
  success: '#34C759',
  danger: '#FF3B30',
};

interface SyncProgress {
  isSyncing: boolean;
  synced: number;
  total: number;
  lastSync: string | null;
}

export const SyncProgressBar: React.FC = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isSyncing: false,
    synced: 0,
    total: 0,
    lastSync: null,
  });
  const [isOnline, setIsOnline] = useState(true);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkService.subscribe(online => {
      setIsOnline(online);
    });

    // Poll sync status every 2 seconds
    const interval = setInterval(updateSyncProgress, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updateSyncProgress = async () => {
    const status = await syncService.getSyncStatus();
    const pendingChanges = status.pendingChanges;

    setSyncProgress(prev => ({
      ...prev,
      total: pendingChanges,
      lastSync: status.lastSync,
    }));
  };

  // Animate progress bar
  useEffect(() => {
    const progress =
      syncProgress.total > 0
        ? (syncProgress.synced / syncProgress.total) * 100
        : 0;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [syncProgress.synced, syncProgress.total]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Don't show if nothing to sync
  if (syncProgress.total === 0 && !syncProgress.isSyncing) {
    return null;
  }

  const percentage =
    syncProgress.total > 0
      ? Math.round((syncProgress.synced / syncProgress.total) * 100)
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: COLORS.text }]}>
            {syncProgress.isSyncing ? '📤 Syncing data...' : '✅ Sync complete'}
          </Text>
          {syncProgress.total > 0 && (
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
              {syncProgress.synced} of {syncProgress.total} items
            </Text>
          )}
        </View>
        {!isOnline && (
          <Text style={[styles.offlineText, { color: COLORS.danger }]}>
            📡 Offline
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      {syncProgress.total > 0 && (
        <View
          style={[styles.progressContainer, { backgroundColor: COLORS.border }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: syncProgress.isSyncing
                  ? COLORS.primary
                  : COLORS.success,
              },
            ]}
          />
        </View>
      )}

      {/* Status Text */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: COLORS.textSecondary }]}>
          {syncProgress.isSyncing
            ? `Syncing... ${percentage}%`
            : syncProgress.lastSync
            ? `Last synced: ${formatTime(syncProgress.lastSync)}`
            : 'Ready to sync'}
        </Text>
      </View>
    </View>
  );
};

const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'unknown';
  }
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
