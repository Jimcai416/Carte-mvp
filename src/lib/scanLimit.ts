import AsyncStorage from "@react-native-async-storage/async-storage";

// Monetization gate for the MVP test build:
// - First full menu scan is free (photos visible).
// - Every scan after that still works, but dish photos are blurred
//   until the user "subscribes" (paywall is a stub at this stage).
// Swap `isUnlocked` for a RevenueCat entitlement check before launch.

const SCANS_KEY = "dishlens.scans";
const UNLOCK_KEY = "dishlens.unlocked";

export const FREE_FULL_SCANS = 1;

export async function getScanCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(SCANS_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function incrementScanCount(): Promise<number> {
  const next = (await getScanCount()) + 1;
  await AsyncStorage.setItem(SCANS_KEY, String(next));
  return next;
}

export async function isUnlocked(): Promise<boolean> {
  return (await AsyncStorage.getItem(UNLOCK_KEY)) === "true";
}

// Dev/test unlock — wire to RevenueCat purchase later.
export async function setUnlocked(value: boolean): Promise<void> {
  await AsyncStorage.setItem(UNLOCK_KEY, value ? "true" : "false");
}

export async function resetForTesting(): Promise<void> {
  await AsyncStorage.multiRemove([SCANS_KEY, UNLOCK_KEY]);
}
