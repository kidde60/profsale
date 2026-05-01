/**
 * ProfSale - Professional Sales Management App
 * Built with React Native
 *
 * @format
 */

import React, { useState, useCallback } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Toast } from './src/components';
import { setToastHandler } from './src/utils/errorHandler';
import { COLORS } from './src/constants/theme';
import type { ToastType } from './src/components/Toast';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [showToast, setShowToast] = useState(false);

  const handleShowToast = useCallback((message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  React.useEffect(() => {
    setToastHandler(handleShowToast);
  }, [handleShowToast]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.primary}
      />
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <AppNavigator />
          {showToast && (
            <Toast
              message={toastMessage}
              type={toastType}
              onDismiss={() => setShowToast(false)}
            />
          )}
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
