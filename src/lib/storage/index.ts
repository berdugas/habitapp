import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getStoredItem(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setStoredItem(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function removeStoredItem(key: string) {
  await AsyncStorage.removeItem(key);
}

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  const item = await getStoredItem(key);

  if (!item) {
    return fallback;
  }

  try {
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

export async function setStoredJson<T>(key: string, value: T) {
  await setStoredItem(key, JSON.stringify(value));
}
