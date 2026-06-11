// DishLens design tokens
// Direction: "menu paper meets lacquer" — warm paper ground, ink text,
// one lacquer-red accent used only for actions and price tags.
// Signature element: the dish's original-script name set large in serif,
// like the menu itself, with the translation beneath in quiet sans.

import { Platform } from "react-native";

export const colors = {
  paper: "#FBF6EE",      // warm menu paper
  card: "#FFFFFF",
  ink: "#221C16",        // near-black ink
  inkSoft: "#6E6257",    // secondary text
  lacquer: "#B5311F",    // single accent: CTAs, prices
  lacquerSoft: "#F6E3DF",
  jade: "#2F6B57",       // "worth it" notes only
  line: "#E8DFD2",       // hairline dividers
  flagBg: "#F1EADD",
};

export const fonts = {
  // Original dish names render in the platform serif — closest thing to
  // printed-menu type without bundling font files at MVP stage.
  display: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  body: Platform.select({ ios: "System", android: "sans-serif", default: "sans-serif" }),
};

export const space = (n: number) => n * 4;

export const radius = {
  card: 16,
  pill: 999,
  image: 12,
};
