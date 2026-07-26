import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dish, ScanResult } from "../types";

export const CURRENCY_KEY = "carte.targetCurrency";

export const CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
  { code: "HKD", symbol: "HK$", label: "Hong Kong Dollar" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "KRW", symbol: "₩", label: "South Korean Won" },
  { code: "THB", symbol: "฿", label: "Thai Baht" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const DEFAULT_CURRENCY: CurrencyCode = "GBP";
const CURRENCY_CODES = new Set<string>(CURRENCIES.map((item) => item.code));

let currentCurrency: CurrencyCode = DEFAULT_CURRENCY;

export function getCurrency(): CurrencyCode {
  return currentCurrency;
}

export function getCurrencySymbol(code: string | null | undefined): string {
  return CURRENCIES.find((item) => item.code === code)?.symbol ?? code ?? "";
}

export function setCurrency(code: string): CurrencyCode {
  if (!CURRENCY_CODES.has(code)) return currentCurrency;
  currentCurrency = code as CurrencyCode;
  AsyncStorage.setItem(CURRENCY_KEY, currentCurrency).catch(() => {});
  return currentCurrency;
}

export async function initCurrency(): Promise<CurrencyCode> {
  try {
    const saved = await AsyncStorage.getItem(CURRENCY_KEY);
    if (saved && CURRENCY_CODES.has(saved)) {
      currentCurrency = saved as CurrencyCode;
    }
  } catch {
    // The default remains available even when storage cannot be read.
  }
  return currentCurrency;
}

export function convertedPriceForDish(dish: Dish): string | null {
  return dish.converted_price ?? dish.price_gbp ?? null;
}

export function displayCurrencyForResult(result: ScanResult): string {
  if (result.display_currency) return result.display_currency;

  // Results created by the pre-currency Worker only contain price_gbp.
  // Keep those scans honestly labelled as GBP, regardless of the user's
  // current preference.
  if (result.dishes.some((dish) => !!dish.price_gbp)) return "GBP";
  return result.currency ?? getCurrency();
}

export function parseMoney(value: string | null | undefined): number {
  if (!value) return 0;
  let numeric = value.replace(/[^0-9,.\-]/g, "");
  if (!numeric) return 0;

  const comma = numeric.lastIndexOf(",");
  const dot = numeric.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    numeric =
      comma > dot
        ? numeric.replace(/\./g, "").replace(",", ".")
        : numeric.replace(/,/g, "");
  } else if (comma >= 0) {
    const decimals = numeric.length - comma - 1;
    numeric = decimals === 2 ? numeric.replace(",", ".") : numeric.replace(/,/g, "");
  }

  const amount = Number.parseFloat(numeric);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatMoney(amount: number, code: string): string {
  const symbol = getCurrencySymbol(code);
  const zeroDecimal = code === "JPY" || code === "KRW";
  const formatted = zeroDecimal ? Math.round(amount).toString() : amount.toFixed(2);
  return symbol ? `${symbol}${formatted}` : `${code} ${formatted}`;
}
