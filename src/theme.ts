// Carte design tokens — "daylight bistro × boarding pass"
// Light paper surfaces, ink text, deep gold accents, mono ticket labels.
// Token NAMES are kept from v0.5 so every component works unchanged:
//   night = app background, surface = cards, cream = primary text, etc.
// The previous dark palette is preserved at the bottom for a future dark mode.

import { Platform } from "react-native";

export const colors = {
  night: "#F7F3EA",       // app background (paper)
  surface: "#FFFDF8",     // cards / ticket (warm white)
  line: "#E2DCCB",        // hairlines, perforation
  lineSoft: "#C9C1AD",    // secondary button border
  cream: "#1C1B17",       // primary text (ink)
  muted: "#8A857A",       // secondary text
  gold: "#D9920F",        // accent: CTAs, stamps, prices (deep gold)
  goldInk: "#1F1300",     // text on gold
  goldSoft: "#8A6A1F",    // worth-it advice lines (olive gold)
  // Share card (unchanged — light paper, pops in chat threads):
  paper: "#FBF6EE",
  ink: "#221C16",
  paperLine: "#E8DFD2",
};

// Midnight palette, kept for a future dark-mode toggle:
// night #15130E · surface #211E16 · line #3C362A · lineSoft #4A4334
// cream #F3EDE0 · muted #9C937F · gold #E8A33C · goldSoft #D9B36A

export const fonts = {
  display: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  body: Platform.select({ ios: "System", android: "sans-serif", default: "sans-serif" }),
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
};

export const space = (n: number) => n * 4;

export const radius = {
  card: 14,
  pill: 999,
  image: 12,
};
