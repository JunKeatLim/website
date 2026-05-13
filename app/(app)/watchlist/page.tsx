"use client"

import { useRouter } from "next/navigation"
import { WatchlistPage } from "@/components/company/WatchlistPage"

export default function WatchlistRoutePage() {
  const router = useRouter()

  return (
    <>
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <WatchlistPage
          onCompanyClick={(name) => router.push(`/market-intelligence?q=${encodeURIComponent(name)}`)}
          onNewSearch={() => router.push("/market-intelligence")}
        />
      </main>
    </>
  )
}
