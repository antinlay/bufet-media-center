import * as SecureStore from 'expo-secure-store';
import type { ConcertoUser } from '@bufet/shared';

const TOKEN_KEY = 'bufet_dash_token';
const USER_KEY = 'bufet_dash_user';

const isWeb = process.env.EXPO_OS === 'web';

const getLocalStorage = () => {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

export type StoredAuth = {
  token: string;
  user: ConcertoUser | null;
};

export async function saveAuth(auth: StoredAuth) {
  const ls = getLocalStorage();
  if (ls) {
    ls.setItem(TOKEN_KEY, auth.token);
    ls.setItem(USER_KEY, JSON.stringify(auth.user ?? null));
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, auth.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(auth.user ?? null));
}

export async function loadAuth(): Promise<StoredAuth | null> {
  const ls = getLocalStorage();
  if (ls) {
    const token = ls.getItem(TOKEN_KEY);
    const userRaw = ls.getItem(USER_KEY);
    if (!token) return null;
    return {
      token,
      user: userRaw ? (JSON.parse(userRaw) as StoredAuth['user']) : null,
    };
  }
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  const userRaw = await SecureStore.getItemAsync(USER_KEY);
  return {
    token,
    user: userRaw ? (JSON.parse(userRaw) as StoredAuth['user']) : null,
  };
}

export async function clearAuth() {
  const ls = getLocalStorage();
  if (ls) {
    ls.removeItem(TOKEN_KEY);
    ls.removeItem(USER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function savePreference(key: string, value: string) {
  const ls = getLocalStorage();
  if (ls) {
    ls.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function loadPreference(key: string) {
  const ls = getLocalStorage();
  if (ls) return ls.getItem(key);
  return SecureStore.getItemAsync(key);
}
