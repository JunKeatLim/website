"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { useCompanySuggest } from "@/hooks"
import theme, { p } from "@/lib/theme"

interface SearchBoxProps {
  value:        string
  onChange:     (v: string) => void
  /** Called when the user commits a search. domain is set when picked from dropdown. */
  onSearch:     (name: string, domain?: string) => void
  placeholder?: string
  /** "lg" = landing hero (tall pill + Search button); "sm" = topbar (compact pill) */
  size?:        "sm" | "lg"
  autoFocus?:   boolean
}

// ─── Logo thumbnail shown in each dropdown row ────────────────────────────────
function SuggestionLogo({ name, logo, domain }: { name: string; logo: string | null; domain: string }) {
  const [failed, setFailed] = useState(false)
  const src = logo ?? (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="w-8 h-8 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
      />
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-black flex-shrink-0"
      style={{ background: p(0.1), color: theme.primary }}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SearchBox({
  value,
  onChange,
  onSearch,
  placeholder = "Search any company…",
  size        = "lg",
  autoFocus   = false,
}: SearchBoxProps) {
  const [open, setOpen]         = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef                 = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  const { suggestions, suggesting } = useCompanySuggest(value)

  const showDropdown = open && (suggestions.length > 0 || (suggesting && value.length > 0))

  // Close when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  // Reset active index whenever suggestions list changes
  useEffect(() => { setActiveIdx(-1) }, [suggestions])

  function commit(name: string, domain?: string) {
    onChange(name)
    setOpen(false)
    setActiveIdx(-1)
    onSearch(name, domain)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") { setOpen(false); onSearch(value.trim()) }
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, -1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIdx >= 0 && suggestions[activeIdx]) {
          commit(suggestions[activeIdx].name, suggestions[activeIdx].domain)
        } else {
          setOpen(false)
          onSearch(value.trim())
        }
        break
      case "Escape":
        setOpen(false)
        setActiveIdx(-1)
        break
    }
  }

  const isLg = size === "lg"

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* ── Input pill ──────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2.5 ${isLg ? "h-14 px-4 rounded-2xl" : "h-10 px-3.5 rounded-full"}`}
        style={{
          background:         "rgba(255,255,255,0.62)",
          backdropFilter:     "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border:             "1px solid rgba(255,255,255,0.75)",
          boxShadow:          "0 2px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <Search size={isLg ? 15 : 13} color="#b8bac8" className="flex-shrink-0" />
        <input
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`bg-transparent flex-1 outline-none placeholder:text-gray-400/60 text-gray-900 ${isLg ? "text-[14px]" : "text-[13px]"}`}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { onChange(""); setOpen(false); inputRef.current?.focus() }}
            className="text-gray-300 hover:text-gray-500 transition-colors text-xs flex-shrink-0"
          >
            ✕
          </button>
        )}
        {isLg && (
          <button
            onClick={() => { setOpen(false); onSearch(value.trim()) }}
            className="h-9 px-4 rounded-xl text-[12px] font-bold text-white flex-shrink-0 transition-opacity hover:opacity-85"
            style={{ background: theme.primary }}
          >
            Search
          </button>
        )}
      </div>

      {/* ── Dropdown ────────────────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            background:  "rgba(255,255,255,0.97)",
            border:      "1px solid rgba(0,0,0,0.06)",
            boxShadow:   "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          {suggesting && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-[12px] text-gray-400">
              <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Searching…
            </div>
          )}

          {suggestions.map((s, i) => (
            <button
              key={s.domain}
              type="button"
              // mouseDown fires before onBlur so we get the click before dropdown closes
              onMouseDown={e => { e.preventDefault(); commit(s.name, s.domain) }}
              className={[
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                i < suggestions.length - 1 ? "border-b border-gray-50" : "",
                i === activeIdx ? "bg-orange-50" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <SuggestionLogo name={s.name} logo={s.logo} domain={s.domain} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 leading-tight">{s.name}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.domain}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
