import * as SecureStore from 'expo-secure-store';
const isWeb = process.env.EXPO_OS === 'web';

const getLocalStorage = () => {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

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
