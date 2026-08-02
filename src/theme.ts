import { Platform } from "react-native";

// Tavue design tokens — warm porcelain × lively food accents.
// The neutral canvas gives food photography room to carry the colour. Tomato
// coral is reserved for action, while citrus adds small moments of appetite.

export const colors = {
  background: "#F7F3EE",
  surface: "#FFFDFC",
  surfaceRaised: "#FFFFFF",
  line: "#E7DED7",
  lineStrong: "#D6C8BE",
  text: "#241D1B",
  muted: "#71645F",
  mutedSoft: "#A59994",
  accent: "#E4573F",
  accentStrong: "#B83A29",
  primaryAction: "#B9513E",
  onAccent: "#FFFFFF",
  onAccentMuted: "rgba(255, 255, 255, 0.84)",
  accentMuted: "#E9A51A",
  accentWash: "#FFF0C7",
  sage: "#4F775A",
  sageWash: "#E8F1E7",
  danger: "#B73732",
  dangerWash: "#FCE8E4",
  paper: "#FFF8E8",
  ink: "#241D1B",
  paperLine: "#E6D7BD",
  imageShade: "rgba(62, 26, 20, 0.14)",
  overlay: "rgba(37, 25, 22, 0.48)",
  glass: "rgba(255, 255, 255, 0.48)",
  glassStrong: "rgba(255, 255, 255, 0.68)",
  glassEdge: "rgba(247, 243, 238, 0.44)",
  glassLine: "rgba(255, 255, 255, 0.82)",
  ambientCoral: "rgba(238, 102, 75, 0.13)",
  ambientCitrus: "rgba(244, 183, 45, 0.15)",
  ambientRose: "rgba(226, 139, 121, 0.10)",
};

export const fonts = {
  display: "CormorantGaramond_600SemiBold",
  displayMedium: "CormorantGaramond_500Medium",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemibold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
  // Native text is a deliberate fallback for scripts not covered by the Latin fonts.
  native: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "system-ui",
  }),
  mono: "DMSans_600SemiBold",
};

export const space = (n: number) => n * 4;

export const radius = {
  card: 18,
  sheet: 26,
  pill: 999,
  image: 14,
  button: 16,
};

export const shadow = {
  card: {
    shadowColor: "#50352F",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  glass: {
    shadowColor: "#50352F",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
};
