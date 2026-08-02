import AsyncStorage from "@react-native-async-storage/async-storage";
import { readMigratedValue, removeValueAndLegacy } from "./storage";

// Monetization gate for the MVP test build:
// - First full menu scan is free (photos visible).
// - Every scan after that still works, but dish photos are blurred
//   until the user "subscribes" (paywall is a stub at this stage).
// Swap `isUnlocked` for a RevenueCat entitlement check before launch.

const SCANS_KEY = "tavue.scans";
const LEGACY_SCANS_KEYS = ["dishlens.scans", "carte.scans"];
const UNLOCK_KEY = "tavue.unlocked";
const LEGACY_UNLOCK_KEYS = ["dishlens.unlocked", "carte.unlocked"];

export const FREE_FULL_SCANS = 1;

export async function getScanCount(): Promise<number> {
  const raw = await readMigratedValue(SCANS_KEY, LEGACY_SCANS_KEYS);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function incrementScanCount(): Promise<number> {
  const next = (await getScanCount()) + 1;
  await AsyncStorage.setItem(SCANS_KEY, String(next));
  return next;
}

export async function isUnlocked(): Promise<boolean> {
  return (await readMigratedValue(UNLOCK_KEY, LEGACY_UNLOCK_KEYS)) === "true";
}

// Dev/test unlock — wire to RevenueCat purchase later.
export async function setUnlocked(value: boolean): Promise<void> {
  await AsyncStorage.setItem(UNLOCK_KEY, value ? "true" : "false");
}

export async function resetForTesting(): Promise<void> {
  await Promise.all([
    removeValueAndLegacy(SCANS_KEY, LEGACY_SCANS_KEYS),
    removeValueAndLegacy(UNLOCK_KEY, LEGACY_UNLOCK_KEYS),
  ]);
}
