"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { CompanySummary, ApiResponse } from "@/types"
import type { SGMarketData } from "@/app/api/market/route"

// ─── Company search hook ──────────────────────────────────────────────────────
export function useCompanySearch() {
  const [data, setData]       = useState<CompanySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [query, setQuery]     = useState("")

  // domain: supplied when user picks from the autocomplete dropdown so we skip
  // the ambiguous Clearbit re-lookup and go straight to the correct company.
  const search = useCallback(async (q: string, domain?: string) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setQuery(q)

    try {
      const params = new URLSearchParams({ q: q.trim() })
      if (domain) params.set("domain", domain)
      const res  = await fetch(`/api/company/search?${params}`)
      const json: ApiResponse<CompanySummary> = await res.json()

      if (!res.ok || json.error) {
        setError(json.error ?? "Company not found")
        setData(null)
      } else {
        setData(json.data)
      }
    } catch {
      setError("Network error — please try again")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, query, search }
}

// ─── Company suggest hook (autocomplete) ─────────────────────────────────────
export interface Suggestion {
  name:   string
  domain: string
  logo:   string | null
}

export function useCompanySuggest(query: string, delayMs = 280) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggesting, setSuggesting]   = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setSuggestions([]); return }

    timer.current = setTimeout(async () => {
      setSuggesting(true)
      try {
        const res  = await fetch(`/api/company/suggest?q=${encodeURIComponent(query)}`)
        const data: Suggestion[] = await res.json()
        setSuggestions(data ?? [])
      } catch {
        setSuggestions([])
      } finally {
        setSuggesting(false)
      }
    }, delayMs)

    return () => clearTimeout(timer.current)
  }, [query, delayMs])

  return { suggestions, suggesting }
}

// ─── Market data hook ─────────────────────────────────────────────────────────
export function useMarketData() {
  const [data, setData]       = useState<SGMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/market")
      .then(r => r.json())
      .then(setData)
      .catch(() => setError("Failed to load market data"))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ─── Watchlist hook (localStorage) ───────────────────────────────────────────
export interface WatchlistEntry {
  companyName: string
  industry?:   string
  valuation?:  string
  lastDeal?:   string
  addedAt:     string
}

const WL_KEY = "finsight_watchlist"

function readWL(): WatchlistEntry[] {
  try { const r = localStorage.getItem(WL_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function writeWL(items: WatchlistEntry[]) {
  try { localStorage.setItem(WL_KEY, JSON.stringify(items)) } catch {}
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistEntry[]>([])

  useEffect(() => { setItems(readWL()) }, [])

  const remove = useCallback((companyName: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.companyName.toLowerCase() !== companyName.toLowerCase())
      writeWL(next)
      return next
    })
  }, [])

  const toggle = useCallback((entry: WatchlistEntry) => {
    setItems(prev => {
      const exists = prev.some(i => i.companyName.toLowerCase() === entry.companyName.toLowerCase())
      const next = exists
        ? prev.filter(i => i.companyName.toLowerCase() !== entry.companyName.toLowerCase())
        : [entry, ...prev]
      writeWL(next)
      return next
    })
  }, [])

  const isWatched = useCallback((companyName: string) =>
    items.some(i => i.companyName.toLowerCase() === companyName.toLowerCase()),
  [items])

  return { items, remove, toggle, isWatched }
}

// ─── Recent searches (localStorage) ──────────────────────────────────────────
export function useRecentSearches() {
  const [recents, setRecents] = useState<Array<{ name: string; meta: string; time: string }>>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("finsight_recents")
      if (stored) setRecents(JSON.parse(stored))
    } catch {}
  }, [])

  const add = useCallback((name: string, meta: string) => {
    setRecents(prev => {
      const filtered = prev.filter(r => r.name !== name)
      const next = [{ name, meta, time: "Just now" }, ...filtered].slice(0, 8)
      try { localStorage.setItem("finsight_recents", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { recents, add }
}
