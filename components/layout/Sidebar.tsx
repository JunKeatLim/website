"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import theme, { p } from "@/lib/theme"

const WL_KEY = "finsight_watchlist"

const NAV_ITEMS = [
  {
    href: "/market-times",
    title: "THE MARKET TIMES",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 14l4-4 4 2 6-7" /><path d="M16 5h2v2" />
      </svg>
    ),
  },
  {
    href: "/market-intelligence",
    title: "MARKET INTELLIGENCE",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10h3l2.5-6 3 12 2.5-6H19" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/watchlist",
    title: "Watchlist",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 2l2.4 5 5.6.8-4 3.9.9 5.6L10 14.5l-4.9 2.8.9-5.6L2 7.8l5.6-.8z" />
      </svg>
    ),
    isWatchlist: true,
  },
]

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const [watchlistCount, setWatchlistCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  // Read watchlist count from localStorage and keep in sync
  useEffect(() => {
    const read = () => {
      try {
        const items = JSON.parse(localStorage.getItem(WL_KEY) ?? "[]")
        setWatchlistCount(Array.isArray(items) ? items.length : 0)
      } catch { setWatchlistCount(0) }
    }
    read()
    window.addEventListener("storage", read)
    // Poll every 2s to catch same-tab updates
    const interval = setInterval(read, 2000)
    return () => { window.removeEventListener("storage", read); clearInterval(interval) }
  }, [])

  return (
    <aside
      className="flex flex-col items-center flex-shrink-0 py-4 md:py-5 gap-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        background: theme.primary,
        width: expanded ? "240px" : "62px",
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <Link
        href="/market-times"
        className="flex items-center flex-shrink-0 mb-6 md:mb-8 cursor-pointer overflow-hidden"
        style={{ height: "42px", width: expanded ? "210px" : "42px", transition: "width 0.3s ease" }}
      >
        <Logo iconSize={42} collapsed={!expanded} theme="dark" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1.5 flex-1 w-full px-2 md:px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/market-times" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={expanded ? undefined : item.title}
              className="relative flex items-center gap-3 rounded-xl transition-all cursor-pointer w-full group"
              style={{
                height: "44px",
                paddingLeft: "11px",
                paddingRight: "11px",
                background: isActive ? p(0.18) : "transparent",
                color: isActive ? theme.primary : "rgba(255,255,255,0.35)",
                justifyContent: expanded ? "flex-start" : "center",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
                  style={{ background: theme.primary }}
                />
              )}

              <span className="flex-shrink-0 relative">
                {item.icon}
                {item.isWatchlist && watchlistCount > 0 && !expanded && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold border-2"
                    style={{ fontSize: "9px", background: theme.primary, borderColor: theme.primary }}
                  >
                    {watchlistCount}
                  </span>
                )}
              </span>

              {expanded && (
                <span className="text-[13px] font-semibold whitespace-nowrap overflow-hidden flex-1" style={{ transition: "opacity 0.2s ease 0.1s" }}>
                  {item.title}
                </span>
              )}

              {expanded && item.isWatchlist && watchlistCount > 0 && (
                <span
                  className="ml-auto w-5 h-5 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                  style={{ fontSize: "9px", background: theme.primary }}
                >
                  {watchlistCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        title={expanded ? undefined : "Sign out"}
        className="flex items-center gap-3 rounded-xl transition-all cursor-pointer w-full mt-2"
        style={{
          paddingLeft: "11px",
          paddingRight: "11px",
          height: "44px",
          color: "rgba(255,255,255,0.35)",
          background: "transparent",
          border: "none",
          justifyContent: expanded ? "flex-start" : "center",
          opacity: loggingOut ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        {/* Sign-out icon */}
        <svg width="18" height="18" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0">
          <path d="M13 15l4-5-4-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 10H7" strokeLinecap="round" />
          <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" strokeLinecap="round" />
        </svg>
        {expanded && (
          <span className="text-[13px] font-semibold whitespace-nowrap" style={{ transition: "opacity 0.2s ease 0.1s" }}>
            {loggingOut ? "Signing out…" : "Sign out"}
          </span>
        )}
      </button>
    </aside>
  )
}
