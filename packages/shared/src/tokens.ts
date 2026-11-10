/**
 * MockLab Design System Tokens — "Signal Lime on Graphite" (§3.1)
 *
 * Mandatory tokens:
 * Primary accent: Signal lime #BFFF3C (dark) / #65A30D (light)
 * Page bg: #101208 (dark) / #F4F5EF (light)
 * Code editor: #0C0E07 (dark) / #E7E9DC (light)
 * No blue or purple used as brand color.
 */

export const TOKENS = {
  dark: {
    signal: "#BFFF3C",
    signalDim: "#2A3313",
    ink: "#F2F5E9",
    ink2: "#A8B09A",
    ink3: "#6E7663",
    surface0: "#101208",
    surface1: "#171A10",
    surface2: "#1F2318",
    surface3: "#0C0E07",
    border: "#2A2E22",
    borderStrong: "#3D4232",
    success: "#4ADE80",
    warning: "#FACC15",
    danger: "#F87171",
    info: "#67E8F9",
  },
  light: {
    signal: "#65A30D",
    signalDim: "#ECFCCB",
    ink: "#131A0A",
    ink2: "#4A5240",
    ink3: "#7A8270",
    surface0: "#F4F5EF",
    surface1: "#FFFFFF",
    surface2: "#ECEEE3",
    surface3: "#E7E9DC",
    border: "#D8DACE",
    borderStrong: "#B9BCAE",
    success: "#15803D",
    warning: "#A16207",
    danger: "#B91C1C",
    info: "#0E7490",
  },
} as const;

export const METHOD_COLORS = {
  GET: {
    color: "#4ADE80",
    bg: "rgba(74, 222, 128, 0.12)",
  },
  POST: {
    color: "#FACC15",
    bg: "rgba(250, 204, 21, 0.12)",
  },
  PUT: {
    color: "#67E8F9",
    bg: "rgba(103, 232, 249, 0.12)",
  },
  PATCH: {
    color: "#C084FC",
    bg: "rgba(192, 132, 252, 0.12)",
  },
  DELETE: {
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.12)",
  },
  HEAD: {
    color: "#A8B09A",
    bg: "rgba(168, 176, 154, 0.12)",
  },
  OPTIONS: {
    color: "#A8B09A",
    bg: "rgba(168, 176, 154, 0.12)",
  },
} as const;

export type HttpMethod = keyof typeof METHOD_COLORS;
