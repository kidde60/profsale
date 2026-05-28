import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { syncService } from '../services/syncService';
import { networkService } from '../services/networkService';

const COLORS = {
  warning: '#FFA500',
  danger: '#FF6B6B',
  text: '#333333',
};

interface SyncStatus {
  lastSync: string | null;
  pendingChanges: number;
}

export const SyncStatusBadge: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    pendingChanges: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Get initial sync status
    updateSyncStatus();

    // Subscribe to network changes
    const unsubscribe = networkService.subscribe(online => {
      setIsOnline(online);
      if (online) {
        updateSyncStatus();
      }
    });

    // Poll sync status every 5 seconds
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updateSyncStatus = async () => {
    const status = await syncService.getSyncStatus();
    setSyncStatus(status);
  };

  if (syncStatus.pendingChanges === 0) {
    return null; // Don't show badge if nothing to sync
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isOnline ? COLORS.warning : COLORS.danger },
      ]}
    >
      <Text style={[styles.badgeText, { color: COLORS.text }]}>
        {isOnline ? '⚠️' : '📡'} {syncStatus.pendingChanges} unsynced
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
