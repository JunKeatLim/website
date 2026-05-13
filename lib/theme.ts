// ─────────────────────────────────────────────────────────────────────────────
//  THEME CONFIG  — change PRIMARY to retheme the entire platform.
//  No other file needs to be touched.
// ─────────────────────────────────────────────────────────────────────────────

/** ← Change this one value to update the primary colour everywhere */
export const PRIMARY = "#372c1fea"

// ─── Derived (auto-computed from PRIMARY) ─────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const [R, G, B] = hexToRgb(PRIMARY)

/** Create an rgba() string from the primary colour at any opacity. e.g. p(0.1) */
export function p(alpha: number): string {
  return `rgba(${R},${G},${B},${alpha})`
}

/** "R, G, B" string for use in CSS: rgba(var(--cp-rgb), 0.1) */
export const PRIMARY_RGB = `${R}, ${G}, ${B}`

// ─── Full theme object ────────────────────────────────────────────────────────

export const theme = {
  /** Primary brand colour */
  primary: PRIMARY,

  /** App canvas background */
  background: "#f0f4ff",

  /** Logo icon dark background */
  logoIconBg: "#0d1525",

  /** Gradient accent colours (logo frame + chart fills) */
  gradientStart: "#22d3ee",
  gradientEnd: "#818cf8",

  /** Semantic / status colours — independent of primary */
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#9ca3af",

  /** Chart line colours */
  chartBlue: "#3b82f6",
  chartAmber: "#f59e0b",
} as const

export default theme
