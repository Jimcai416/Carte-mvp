import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScanResult } from "../types";

const KEY = "dishlens.history";
const MAX_SAVED = 10;

export interface SavedScan {
  id: string;
  date: string; // ISO
  language: string;
  result: ScanResult;
}

export async function getHistory(): Promise<SavedScan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedScan[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveScan(
  result: ScanResult,
  language: string
): Promise<void> {
  try {
    const list = await getHistory();
    list.unshift({
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      language,
      result,
    });
    await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_SAVED)));
  } catch {
    // History is a convenience — never block a scan on it.
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export function describeWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
