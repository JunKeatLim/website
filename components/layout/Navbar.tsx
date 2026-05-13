"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import theme, { p } from "@/lib/theme"

const NAV_ITEMS = [
  { href: "/market-times",       label: "Market Times" },
  { href: "/market-intelligence", label: "Market Intelligence" },
  { href: "/watchlist",           label: "Watchlist" },
]

export function Navbar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const [leaving, setLeaving] = useState(false)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [barHovered, setBarHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)

  async function handleLogout() {
    setLeaving(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header
      onMouseEnter={() => setBarHovered(true)}
      onMouseLeave={() => {
        setBarHovered(false)
        setHoveredHref(null)
        setLogoutHovered(false)
      }}
      style={{
        height: 60,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        paddingLeft: 24,
        paddingRight: 24,
        gap: 8,
        background: barHovered ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.86)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: barHovered ? `1px solid ${p(0.11)}` : `1px solid ${p(0.08)}`,
        borderRadius: 16,
        boxShadow: barHovered ? `0 12px 34px ${p(0.15)}` : `0 8px 30px ${p(0.10)}`,
        position: "fixed",
        top: 20,
        left: "clamp(16px, 2vw, 28px)",
        right: "clamp(16px, 2vw, 28px)",
        width: "auto",
        zIndex: 40,
        transition: "all 0.2s ease",
      }}
    >
      {/* Logo */}
      <Link href="/market-times" style={{ textDecoration: "none", flexShrink: 0, marginRight: 16 }}>
        <Logo iconSize={34} theme="light" />
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/market-times" && pathname.startsWith(href))
          const isHovered = hoveredHref === href
          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => setHoveredHref(href)}
              onMouseLeave={() => setHoveredHref(null)}
              style={{
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 700 : isHovered ? 600 : 500,
                color: isActive ? theme.primary : isHovered ? p(0.75) : p(0.42),
                background: isActive ? p(0.08) : isHovered ? p(0.10) : "transparent",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                transform: isHovered ? "translateY(-1px)" : "translateY(0)",
                transition: "all 0.18s ease",
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        disabled={leaving}
        onMouseEnter={() => setLogoutHovered(true)}
        onMouseLeave={() => setLogoutHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 13px",
          borderRadius: 10,
          border: logoutHovered ? `1px solid ${p(0.18)}` : `1px solid ${p(0.09)}`,
          background: logoutHovered ? p(0.06) : "transparent",
          color: leaving ? p(0.2) : logoutHovered ? p(0.72) : p(0.42),
          fontSize: 12,
          fontWeight: 600,
          cursor: leaving ? "not-allowed" : "pointer",
          flexShrink: 0,
          letterSpacing: "-0.01em",
          transform: logoutHovered ? "translateY(-1px)" : "translateY(0)",
          transition: "all 0.18s ease",
        }}
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8">
          <path d="M13 15l4-5-4-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 10H7" strokeLinecap="round" />
          <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" strokeLinecap="round" />
        </svg>
        {leaving ? "Signing out…" : "Sign out"}
      </button>
    </header>
  )
}
