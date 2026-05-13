"use client"

import { useRouter } from "next/navigation"
import { MarketPage } from "@/components/market/MarketPage"

export default function MarketTimesPage() {
  const router = useRouter()

  return (
    <>
      <main className="flex-1 overflow-hidden min-h-0">
        <MarketPage onCompanyClick={(name) => router.push(`/market-intelligence?q=${encodeURIComponent(name)}`)} />
      </main>
    </>
  )
}
