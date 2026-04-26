import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { networkService } from '../services/networkService';
import { localStorageService } from '../services/localStorageService';

export const OfflineStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = networkService.subscribe(async online => {
      setIsOffline(!online);

      if (online) {
        // Flash animation when coming online
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    });

    // Check queue count periodically
    const checkQueue = async () => {
      const queue = await networkService.getQueue();
      setQueueCount(queue.length);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [animation]);

  if (!isOffline && queueCount === 0) return null;

  return (
    <SafeAreaView
      style={{ backgroundColor: isOffline ? COLORS.error : COLORS.warning }}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.8],
            }),
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.text}>
            {isOffline ? '⚠️ Offline Mode' : '🔄 Syncing...'}
          </Text>
          {queueCount > 0 && (
            <Text style={styles.queueText}>
              {queueCount} pending {queueCount === 1 ? 'request' : 'requests'}
            </Text>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  queueText: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 2,
  },
});
