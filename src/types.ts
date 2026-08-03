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

export interface DishImageAttribution {
  artist: string;              // author as credited on Wikimedia Commons
  licence: string;             // e.g. "CC BY-SA 4.0"
  url: string;                 // Commons file page, for the full credit
}

export interface DishImage {
  url: string;
  source: "commons" | "generated";
  attribution?: DishImageAttribution; // always present for "commons"
}

export interface Dish {
  category?: string | null;    // translated section heading used by the app
  original_category?: string | null; // section exactly as printed, for server handoff
  original_name: string;       // as printed on the menu, original script
  romanized: string | null;    // e.g. "wan tan lo mein"
  translated_name: string;     // target app language
  description: string;         // one plain sentence: what it actually is
  ingredients?: string[];      // optional for scans saved before v0.5.3
  price: string | null;        // as printed, e.g. "48"
  price_gbp?: string | null;   // legacy GBP conversion for older app versions
  converted_price?: string | null; // conversion in ScanResult.display_currency
  spice_level: 0 | 1 | 2 | 3;
  flags: DishFlag[];
  worth_it: string | null;     // one-line ordering advice
  canonical_name?: string | null; // established dish name, or null if descriptive
  canonical_lang?: string | null; // BCP-47 code for canonical_name
  image_key?: string;          // stable cache key derived by the worker
  image?: DishImage | null;    // resolved photo plus its provenance
  image_url?: string | null;   // legacy bare URL, kept for older beta builds
}

export interface ScanResult {
  cuisine: string;             // e.g. "Cantonese"
  currency: string | null;     // ISO code guessed from the menu, e.g. "HKD"
  display_currency?: string | null; // currency selected by the user
  menu_language: string;       // e.g. "Traditional Chinese"
  dishes: Dish[];
  page_count?: number;         // locally merged multi-page scan
}

export type Screen =
  | { name: "scan" }
  | { name: "results"; result: ScanResult };
