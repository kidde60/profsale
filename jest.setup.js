// Jest setup file for React Native
// Mock AsyncStorage
/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  default: {
    configure: jest.fn(),
    fetch: jest.fn(() =>
      Promise.resolve({ isConnected: true, isInternetReachable: true }),
    ),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    useNetInfo: jest.fn(() => ({
      isConnected: true,
      isInternetReachable: true,
    })),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));
