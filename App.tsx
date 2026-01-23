/**
 * ProfSale - Professional Sales Management App
 * Built with React Native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/theme';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.primary}
      />
      <AuthProvider>
        <OfflineProvider>
          <AppNavigator />
        </OfflineProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
