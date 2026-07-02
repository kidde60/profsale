import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { networkService } from '../services/networkService';
import { syncService } from '../services/syncService';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: string | null;
    pendingChanges: number;
  }>({
    lastSync: null,
    pendingChanges: 0,
  });
  const [fadeAnim] = React.useState(new Animated.Value(0));

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkService.subscribe(online => {
      setIsOnline(online);
      if (online) {
        // Trigger sync when coming back online
        syncService.syncNow();
      }
    });

    // Get initial network state
    setIsOnline(networkService.isNetworkAvailable());

    // Update sync status periodically
    const statusInterval = setInterval(async () => {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || syncStatus.pendingChanges > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, syncStatus.pendingChanges, fadeAnim]);

  if (isOnline && syncStatus.pendingChanges === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.indicator}>{isOnline ? '🔄' : '📡'}</Text>
        <View style={styles.textContainer}>
          {!isOnline && <Text style={styles.text}>Offline Mode</Text>}
          {syncStatus.pendingChanges > 0 && (
            <Text style={styles.text}>
              {syncStatus.pendingChanges} pending{' '}
              {syncStatus.pendingChanges === 1 ? 'change' : 'changes'}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '600' as any,
  },
});
