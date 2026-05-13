"use client"

import { useState, useEffect } from "react"
import type { SGMarketData } from "@/app/api/market/route"

interface UseMarketDataResult {
  data: SGMarketData | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useMarketData(): UseMarketDataResult {
  const [data, setData] = useState<SGMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/market")
        if (!res.ok) throw new Error("Failed to fetch market data")
        const json: SGMarketData = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [tick])

  const refresh = () => setTick((t) => t + 1)

  return { data, loading, error, refresh }
}
