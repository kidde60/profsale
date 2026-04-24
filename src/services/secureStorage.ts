// services/secureStorage.ts - Secure token storage with encryption
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Keychain import - optional dependency
let Keychain: any = null;
try {
  Keychain = require('react-native-keychain');
} catch (error) {
  logger.warn('react-native-keychain not installed, falling back to AsyncStorage');
}

class SecureStorage {
  private useKeychain: boolean = true;

  constructor() {
    // Check if keychain is available
    this.useKeychain = Platform.OS !== 'web' && Keychain !== null;
  }

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (this.useKeychain) {
        const result = await Keychain.setGenericPassword(key, value, {
          service: 'profsale',
        });
        return !!result;
      } else {
        // Fallback to AsyncStorage (less secure)
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(`secure_${key}`, value);
        return true;
      }
    } catch (error) {
      logger.error('Failed to store secure item', { error, key });
      return false;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.useKeychain) {
        const result = await Keychain.getGenericPassword({ service: 'profsale' });
        if (result && result.username === key) {
          return result.password;
        }
        return null;
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(`secure_${key}`);
      }
    } catch (error) {
      logger.error('Failed to retrieve secure item', { error, key });
      return null;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      if (this.useKeychain) {
        const result = await Keychain.resetGenericPassword({ service: 'profsale' });
        return result;
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(`secure_${key}`);
        return true;
      }
    } catch (error) {
      logger.error('Failed to remove secure item', { error, key });
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (this.useKeychain) {
        const result = await Keychain.resetGenericPassword({ service: 'profsale' });
        return result;
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const keys = await AsyncStorage.getAllKeys();
        const secureKeys = keys.filter((k: string) => k.startsWith('secure_'));
        await AsyncStorage.multiRemove(secureKeys);
        return true;
      }
    } catch (error) {
      logger.error('Failed to clear secure storage', { error });
      return false;
    }
  }

  // Token-specific methods
  async setAuthToken(token: string): Promise<boolean> {
    return this.setItem('authToken', token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getItem('authToken');
  }

  async removeAuthToken(): Promise<boolean> {
    return this.removeItem('authToken');
  }

  async setRefreshToken(token: string): Promise<boolean> {
    return this.setItem('refreshToken', token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getItem('refreshToken');
  }

  async removeRefreshToken(): Promise<boolean> {
    return this.removeItem('refreshToken');
  }
}

export const secureStorage = new SecureStorage();
export default secureStorage;
