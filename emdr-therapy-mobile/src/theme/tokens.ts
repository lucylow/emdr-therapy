export const colors = {
  ivory: "#FAFAF7",
  white: "#FFFFFF",
  graphite: "#1C1C1E",
  graphiteSoft: "#3A3A3C",
  mist: "#8E8E93",
  cloud: "#F2F2F7",
  silk: "#E5E5EA",
  forest: "#2D6A4F",
  forestMid: "#40916C",
  forestLight: "#74C69D",
  forestPale: "#E8F5F0",
  lavender: "#7C6FCD",
  lavenderSoft: "#9D92D8",
  lavenderPale: "#EEEAF8",
  warm: "#F4A261",
  warmPale: "#FEF3E8",
  danger: "#E45C4A",
  dangerPale: "#FDECEA",
  grow: "#52B788",
  growPale: "#EAF7F0",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  display: 56,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700" as const,
    letterSpacing: -0.8,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.25,
  },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
} as const;

export const shadows = {
  soft: {
    shadowColor: "#1C1C1E",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  card: {
    shadowColor: "#1C1C1E",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const layout = {
  screenPadding: 20,
  maxContentWidth: 430,
  touchTarget: 44,
  minButtonHeight: 52,
} as const;
