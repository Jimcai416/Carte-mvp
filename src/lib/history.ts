import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ScanResult } from "../types";

const KEY = "dishlens.history";
// Web is the instant, single-meal entry point. The app is the durable product.
const MAX_SAVED = Platform.OS === "web" ? 10 : 250;

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

type RelativeTimeCopy = {
  now: string;
  recent: string;
  minute: (value: number) => string;
  hour: (value: number) => string;
  day: (value: number) => string;
};

const RELATIVE_TIME: Record<string, RelativeTimeCopy> = {
  English: {
    now: "just now",
    recent: "recently",
    minute: (value) => `${value} min ago`,
    hour: (value) => `${value} hr ago`,
    day: (value) => `${value}d ago`,
  },
  "Chinese (Simplified)": {
    now: "刚刚",
    recent: "最近",
    minute: (value) => `${value}分钟前`,
    hour: (value) => `${value}小时前`,
    day: (value) => `${value}天前`,
  },
  "Chinese (Traditional)": {
    now: "剛剛",
    recent: "最近",
    minute: (value) => `${value}分鐘前`,
    hour: (value) => `${value}小時前`,
    day: (value) => `${value}天前`,
  },
  French: {
    now: "à l'instant",
    recent: "récemment",
    minute: (value) => `il y a ${value} min`,
    hour: (value) => `il y a ${value} h`,
    day: (value) => `il y a ${value} j`,
  },
  Italian: {
    now: "adesso",
    recent: "recentemente",
    minute: (value) => `${value} min fa`,
    hour: (value) => `${value} h fa`,
    day: (value) => `${value} g fa`,
  },
  Spanish: {
    now: "ahora",
    recent: "recientemente",
    minute: (value) => `hace ${value} min`,
    hour: (value) => `hace ${value} h`,
    day: (value) => `hace ${value} d`,
  },
  Japanese: {
    now: "たった今",
    recent: "最近",
    minute: (value) => `${value}分前`,
    hour: (value) => `${value}時間前`,
    day: (value) => `${value}日前`,
  },
  Korean: {
    now: "방금",
    recent: "최근",
    minute: (value) => `${value}분 전`,
    hour: (value) => `${value}시간 전`,
    day: (value) => `${value}일 전`,
  },
  Thai: {
    now: "เมื่อสักครู่",
    recent: "เมื่อเร็ว ๆ นี้",
    minute: (value) => `${value} นาทีที่แล้ว`,
    hour: (value) => `${value} ชั่วโมงที่แล้ว`,
    day: (value) => `${value} วันที่แล้ว`,
  },
};

export function describeWhen(iso: string, language = "English"): string {
  const then = new Date(iso).getTime();
  const copy = RELATIVE_TIME[language] ?? RELATIVE_TIME.English;

  if (!Number.isFinite(then)) return copy.recent;

  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 1) return copy.now;
  if (mins < 60) return copy.minute(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return copy.hour(hours);
  return copy.day(Math.floor(hours / 24));
}
