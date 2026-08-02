import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dish, DishFlag } from "../types";

const KEY = "carte.foodProfile.v1";

export type FoodPreference =
  | "contains_nuts"
  | "contains_shellfish"
  | "contains_gluten"
  | "contains_dairy"
  | "raw"
  | "offal"
  | "vegetarian"
  | "vegan"
  | "spicy";

export interface FoodProfile {
  avoid: FoodPreference[];
  prefer: FoodPreference[];
}

export const EMPTY_FOOD_PROFILE: FoodProfile = { avoid: [], prefer: [] };

export async function getFoodProfile(): Promise<FoodProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_FOOD_PROFILE;
    const parsed = JSON.parse(raw) as Partial<FoodProfile>;
    return {
      avoid: Array.isArray(parsed.avoid) ? parsed.avoid : [],
      prefer: Array.isArray(parsed.prefer) ? parsed.prefer : [],
    };
  } catch {
    return EMPTY_FOOD_PROFILE;
  }
}

export async function saveFoodProfile(profile: FoodProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

export function riskFlags(dish: Dish, profile: FoodProfile): DishFlag[] {
  return dish.flags.filter((flag) => profile.avoid.includes(flag as FoodPreference));
}

export function isForYou(dish: Dish, profile: FoodProfile): boolean {
  if (riskFlags(dish, profile).length) return false;
  if (!profile.prefer.length) return true;
  return profile.prefer.some((preference) => {
    if (preference === "spicy") return dish.spice_level > 0 || dish.flags.includes("spicy");
    if (preference === "vegetarian") {
      return dish.flags.includes("vegetarian") || dish.flags.includes("vegan");
    }
    return dish.flags.includes(preference as DishFlag);
  });
}
