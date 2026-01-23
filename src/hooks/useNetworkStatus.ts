/**
 * Network Monitor Hook
 * Detects online/offline status and provides network state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';

export interface NetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

/**
 * Hook to monitor network connectivity
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isInternetReachable: true,
    connectionType: null,
  });

  const subscription = useRef<NetInfoSubscription | null>(null);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkState({
        isOnline: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Subscribe to network state changes
    subscription.current = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isOnline: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => {
      if (subscription.current) {
        subscription.current();
      }
    };
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }, []);

  return {
    ...networkState,
    checkConnection,
  };
}

/**
 * Simple function to check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    return false;
  }
}

/**
 * Check if API is reachable
 */
export async function isApiReachable(apiUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal as RequestInit['signal'],
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export default useNetworkStatus;
