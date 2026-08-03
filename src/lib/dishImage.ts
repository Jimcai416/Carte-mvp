import { Dish, DishImageAttribution } from "../types";

// What the UI needs to know about a dish photo. `source` is null for menus
// saved by an older build, whose images predate provenance tracking: those get
// no credit line and no generated marker, because we cannot claim either.
export interface ResolvedDishImage {
  url: string;
  source: "commons" | "generated" | null;
  attribution?: DishImageAttribution;
}

export function resolveDishImage(dish: Dish): ResolvedDishImage | null {
  const image = dish.image;
  if (image?.url) {
    // A Commons photo without its credit must not be shown as one.
    if (image.source === "commons" && !image.attribution) {
      return { url: image.url, source: null };
    }
    return { url: image.url, source: image.source ?? null, attribution: image.attribution };
  }
  if (dish.image_url) return { url: dish.image_url, source: null };
  return null;
}

export function attributionLine(attribution: DishImageAttribution): string {
  return `${attribution.artist} · ${attribution.licence}`;
}
