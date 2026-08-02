import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Read a Tavue storage value while preserving upgrades from earlier beta
 * builds. Legacy values are copied forward, never removed, so a rollback does
 * not discard a tester's settings or saved menus.
 */
export async function readMigratedValue(
  key: string,
  legacyKeys: string[]
): Promise<string | null> {
  const current = await AsyncStorage.getItem(key);
  if (current !== null) return current;

  const legacyValues = await AsyncStorage.multiGet(legacyKeys);
  const migrated = legacyValues.find(([, value]) => value !== null)?.[1] ?? null;
  if (migrated !== null) await AsyncStorage.setItem(key, migrated);
  return migrated;
}

export async function removeValueAndLegacy(
  key: string,
  legacyKeys: string[]
): Promise<void> {
  await AsyncStorage.multiRemove([key, ...legacyKeys]);
}
