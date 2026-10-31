import 'react-native-get-random-values';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';

const KEY_PREFIX = 'bwaka_sec_key:';

class LargeSecureStorage {
  private isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  private getSecureStoreKey(key: string): string {
    const sanitized = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
    return `${KEY_PREFIX}${sanitized}`.slice(0, 255);
  }

  private async getOrCreateEncryptionKey(storeKey: string): Promise<Uint8Array> {
    const existingHex = await SecureStore.getItemAsync(storeKey);
    if (existingHex && existingHex.length === 64) {
      return aesjs.utils.hex.toBytes(existingHex);
    }

    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const newHex = aesjs.utils.hex.fromBytes(keyBytes);
    await SecureStore.setItemAsync(storeKey, newHex, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    return keyBytes;
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.isNative) {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return null;
      }
      return AsyncStorage.getItem(key);
    }

    try {
      const rawStored = await AsyncStorage.getItem(key);
      if (!rawStored) return null;

      const storeKey = this.getSecureStoreKey(key);
      const keyHex = await SecureStore.getItemAsync(storeKey);

      // Handle unencrypted legacy data if upgrading
      if (!keyHex) {
        if (rawStored.startsWith('{') || rawStored.startsWith('[')) {
          await this.setItem(key, rawStored);
          return rawStored;
        }
        return null;
      }

      const keyBytes = aesjs.utils.hex.toBytes(keyHex);
      const encryptedBytes = aesjs.utils.hex.toBytes(rawStored);
      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
      const decryptedBytes = aesCtr.decrypt(encryptedBytes);
      return aesjs.utils.utf8.fromBytes(decryptedBytes);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.isNative) {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return;
      }
      await AsyncStorage.setItem(key, value);
      return;
    }

    try {
      const storeKey = this.getSecureStoreKey(key);
      const keyBytes = await this.getOrCreateEncryptionKey(storeKey);
      const textBytes = aesjs.utils.utf8.toBytes(value);
      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
      const encryptedBytes = aesCtr.encrypt(textBytes);
      const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

      await AsyncStorage.setItem(key, encryptedHex);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isNative) {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return;
      }
      await AsyncStorage.removeItem(key);
      return;
    }

    const storeKey = this.getSecureStoreKey(key);
    await Promise.allSettled([
      SecureStore.deleteItemAsync(storeKey),
      AsyncStorage.removeItem(key),
    ]);
  }
}

export const secureStorage = new LargeSecureStorage();
