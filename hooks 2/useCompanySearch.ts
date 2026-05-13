"use client"

import { useState, useCallback } from "react"
import type { CompanySummary, ApiResponse } from "@/types"

interface UseCompanySearchResult {
  data: CompanySummary | null
  loading: boolean
  error: string | null
  fromCache: boolean
  cachedAt: string | null
  search: (query: string) => Promise<void>
  refresh: (companyName: string) => Promise<void>
  clear: () => void
}

export function useCompanySearch(): UseCompanySearchResult {
  const [data, setData] = useState<CompanySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/company/search?q=${encodeURIComponent(query.trim())}`)
      const json: ApiResponse<CompanySummary> = await res.json()

      if (!res.ok || !json.data) {
        setError(json.error ?? "Company not found")
        setData(null)
        return
      }

      setData(json.data)
      setFromCache(json.fromCache)
      setCachedAt(json.cachedAt ?? null)
    } catch (err) {
      console.error("[useCompanySearch]", err)
      setError("Network error — please try again")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async (companyName: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/company/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      })
      const json: ApiResponse<CompanySummary> = await res.json()
      if (!res.ok || !json.data) {
        setError(json.error ?? "Refresh failed")
        return
      }
      setData(json.data)
      setFromCache(false)
      setCachedAt(json.cachedAt ?? null)
    } catch (err) {
      console.error("[useCompanySearch] refresh error:", err)
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setData(null)
    setError(null)
    setFromCache(false)
    setCachedAt(null)
  }, [])

  return { data, loading, error, fromCache, cachedAt, search, refresh, clear }
}
