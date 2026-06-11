// Shared types — must stay in sync with worker/src/index.js JSON schema.

export type DishFlag =
  | "spicy"
  | "raw"
  | "offal"
  | "contains_nuts"
  | "contains_shellfish"
  | "contains_gluten"
  | "contains_dairy"
  | "vegetarian"
  | "vegan"
  | "house_special";

export interface Dish {
  original_name: string;       // as printed on the menu, original script
  romanized: string | null;    // e.g. "wan tan lo mein"
  translated_name: string;     // English
  description: string;         // one plain sentence: what it actually is
  ingredients: string[];
  price: string | null;        // as printed, e.g. "48"
  price_gbp: string | null;    // rough GBP conversion, e.g. "£4.80"
  spice_level: 0 | 1 | 2 | 3;
  flags: DishFlag[];
  worth_it: string | null;     // one-line ordering advice
  image_url: string | null;    // resolved by the worker (cached lookup)
  image_query: string;         // fallback query if image_url is null
}

export interface ScanResult {
  cuisine: string;             // e.g. "Cantonese"
  currency: string | null;     // ISO code guessed from the menu, e.g. "HKD"
  menu_language: string;       // e.g. "Traditional Chinese"
  dishes: Dish[];
}

export type Screen =
  | { name: "scan" }
  | { name: "results"; result: ScanResult; locked: boolean }
  | { name: "paywall" };
