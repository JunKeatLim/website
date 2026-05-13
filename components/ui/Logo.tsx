"use client"

import { useId } from "react"

interface LogoProps {
  iconSize?: number
  collapsed?: boolean
  theme?: "dark" | "light"
}

export function Logo({ iconSize = 42, collapsed = false, theme: mode = "dark" }: LogoProps) {
  const uid    = useId()
  const clipId = `mg${uid.replace(/:/g, "")}`

  const textColor    = mode === "dark" ? "#ffffff" : "#2b2925"
  const subColor     = mode === "dark" ? "rgba(255,255,255,0.4)" : "#9a9590"
  const nameFontSize = Math.round(iconSize * 0.42)
  const subFontSize  = Math.max(7, Math.round(iconSize * 0.18))

  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(iconSize * 0.3), lineHeight: 1 }}>

      {/* Square viewBox — magnifying glass (handle left) with bar chart inside */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 90 90" fill="none" style={{ flexShrink: 0 }}>
        <defs>
          {/* Clip bars to inside the lens */}
          <clipPath id={clipId}>
            <circle cx="52" cy="36" r="23"/>
          </clipPath>
        </defs>

        {/* ── Handle (lower-left) ── */}
        <line x1="34" y1="55" x2="11" y2="78"
          stroke="#1a2369" strokeWidth="10" strokeLinecap="round"/>

        {/* ── Lens background ── */}
        <circle cx="52" cy="36" r="26" fill="#1a2369"/>

        {/* ── 3 ascending bar-chart columns in MAS red, clipped inside lens ── */}
        {/* All bars share the same baseline; heights ascend left → right       */}
        <rect x="35" y="38" width="9" height="20" rx="1.5" fill="#8C7B6B" clipPath={`url(#${clipId})`}/>
        <rect x="48" y="26" width="9" height="32" rx="1.5" fill="#8C7B6B" clipPath={`url(#${clipId})`}/>
        <rect x="61" y="14" width="9" height="44" rx="1.5" fill="#8C7B6B" clipPath={`url(#${clipId})`}/>

        {/* ── Lens rim ── */}
        <circle cx="52" cy="36" r="26" fill="none" stroke="#0d1540" strokeWidth="4"/>
      </svg>

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, lineHeight: 1 }}>
          <span style={{
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 700,
            fontSize: nameFontSize,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            color: textColor,
          }}>FinSight</span>
          <span style={{
            fontFamily: "'Mulish', sans-serif",
            fontWeight: 400,
            fontSize: subFontSize,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: subColor,
          }}>Market Intelligence Platform</span>
        </div>
      )}
    </div>
  )
}
