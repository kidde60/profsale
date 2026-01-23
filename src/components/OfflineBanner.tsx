/**
 * Offline Status Banner
 * Shows offline indicator and sync status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useOffline } from '../context/OfflineContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface OfflineBannerProps {
  showSyncButton?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  showSyncButton = true,
}) => {
  const { isOfflineMode, isSyncing, pendingSalesCount, triggerSync } =
    useOffline();

  // Don't show if online and no pending items
  if (!isOfflineMode && pendingSalesCount === 0) {
    return null;
  }

  const handleSync = async () => {
    if (isOfflineMode) {
      return; // Can't sync while offline
    }
    await triggerSync();
  };

  return (
    <View
      style={[
        styles.container,
        isOfflineMode ? styles.offlineContainer : styles.pendingContainer,
      ]}
    >
      <View style={styles.content}>
        {isOfflineMode ? (
          <>
            <View style={styles.dot} />
            <Text style={styles.text}>Offline Mode</Text>
            {pendingSalesCount > 0 && (
              <Text style={styles.pendingText}>
                ({pendingSalesCount} pending)
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.text}>
              {pendingSalesCount} sale{pendingSalesCount !== 1 ? 's' : ''}{' '}
              pending sync
            </Text>
            {showSyncButton && !isSyncing && (
              <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
                <Text style={styles.syncButtonText}>Sync Now</Text>
              </TouchableOpacity>
            )}
            {isSyncing && (
              <View style={styles.syncingContainer}>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.syncingText}>Syncing...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  offlineContainer: {
    backgroundColor: COLORS.error,
  },
  pendingContainer: {
    backgroundColor: COLORS.warning,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: SPACING.xs,
  },
  text: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  pendingText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginLeft: SPACING.xs,
    opacity: 0.9,
  },
  syncButton: {
    marginLeft: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  syncingText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
});

export default OfflineBanner;
