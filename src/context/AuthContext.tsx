import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { setGlobalLogoutHandler } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { User, LoginCredentials, RegisterData } from '../types';
import { offlineStorage } from '../services/offline/OfflineStorageSQLite';
import { syncManager } from '../services/offline/SyncManager';
import { isOnline } from '../hooks/useNetworkStatus';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOfflineLogin: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineLogin, setIsOfflineLogin] = useState(false);

  // Listen for global logout events using a callback
  useEffect(() => {
    initializeApp();
    setGlobalLogoutHandler(() => {
      setUser(null);
      setIsOfflineLogin(false);
    });
    // No cleanup needed, as handler can be overwritten
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize SQLite database
      await offlineStorage.init();
      console.log('SQLite database initialized');

      // Load user
      await loadUser();
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const online = await isOnline();

    if (online) {
      // Online login - normal flow
      try {
        const response = await authService.login(credentials);
        if (response.user) {
          setUser(response.user);
          setIsOfflineLogin(false);

          // Cache credentials for offline login
          await offlineStorage.cacheCredentials(
            credentials.login,
            credentials.password,
            response.user,
            response.token || '',
          );

          // Cache data for offline use
          syncManager.cacheInitialData();
        }
      } catch (error) {
        throw error;
      }
    } else {
      // Offline login - verify cached credentials
      console.log('Device offline - attempting offline login');

      const result = await offlineStorage.verifyOfflineCredentials(
        credentials.login,
        credentials.password,
      );

      if (result.valid && result.user) {
        setUser(result.user);
        setIsOfflineLogin(true);

        // Store token for API calls (will fail but won't crash)
        if (result.token) {
          await AsyncStorage.setItem('authToken', result.token);
        }
        await AsyncStorage.setItem('user', JSON.stringify(result.user));

        Alert.alert(
          'Offline Mode',
          'You are logged in offline. Sales will be synced when you reconnect to the internet.',
          [{ text: 'OK' }],
        );
      } else {
        throw new Error(
          'Offline login failed. Please connect to the internet to login for the first time.',
        );
      }
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsOfflineLogin(false);
      // Note: We don't clear cached credentials on logout
      // so user can still login offline next time
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const online = await isOnline();
      if (!online) {
        console.log('Cannot refresh user - offline');
        return;
      }

      const profile = await authService.getProfile();
      setUser(profile);
      setIsOfflineLogin(false);
      await AsyncStorage.setItem('user', JSON.stringify(profile));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOfflineLogin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
