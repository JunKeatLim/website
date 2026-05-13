"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Topbar } from "@/components/layout"
import { SearchBox } from "@/components/ui/SearchBox"
import { CompanyPage } from "@/components/company/CompanyPage"
import { useCompanySearch, useRecentSearches, useWatchlist } from "@/hooks"
import theme, { p } from "@/lib/theme"

function MarketIntelligenceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const { data, loading, error, search } = useCompanySearch()
  const { recents, add } = useRecentSearches()
  const { toggle, isWatched } = useWatchlist()

  // Auto-search if ?q= param is present on load
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) {
      setSearchInput(q)
      search(q)
      add(q, "Company search")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Called both from the hero SearchBox and the Topbar SearchBox.
  // domain is set when the user picked a specific suggestion from the dropdown.
  const handleSearch = useCallback(async (name: string, domain?: string) => {
    const q = name.trim()
    if (!q) return
    setSearchInput(q)
    router.replace(`/market-intelligence?q=${encodeURIComponent(q)}`, { scroll: false })
    await search(q, domain)
    add(q, "Company search")
  }, [search, add, router])

  return (
    <>
      <Topbar
        showSearch={loading || !!data || !!error}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        onSearchClear={() => {
          setSearchInput("")
          router.replace("/market-intelligence", { scroll: false })
        }}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Market Intelligence</h2>
            <p className="text-sm text-gray-400 max-w-sm mb-6">
              Enter a company name to get a full intelligence summary — investors, deals, news, contacts and more.
            </p>

            {/* Hero search with autocomplete */}
            <div className="w-full max-w-xl mb-6">
              <SearchBox
                value={searchInput}
                onChange={setSearchInput}
                onSearch={handleSearch}
                size="lg"
                autoFocus
              />
            </div>

            {/* Recent searches */}
            {recents.length > 0 && (
              <div
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{
                  background:           "rgba(255,255,255,0.55)",
                  backdropFilter:       "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  border:               "1px solid rgba(255,255,255,0.7)",
                  boxShadow:            "0 2px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}
              >
                <div className="px-5 py-3 border-b border-white/40 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Recent searches
                </div>
                {recents.map(r => (
                  <button
                    key={r.name}
                    onClick={() => handleSearch(r.name)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors text-left border-b border-white/30 last:border-0"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: p(0.1), color: theme.primary }}
                    >
                      {r.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{r.name}</div>
                    </div>
                    <span className="text-[10.5px] text-gray-400">{r.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[var(--cp)] animate-spin" />
            <p className="text-sm text-gray-400">Fetching company data…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Company not found</h2>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        )}

        {data && !loading && (
          <CompanyPage
            data={data}
            onWatchlist={() => toggle({
              companyName: data.companyName,
              industry:    data.overview?.value?.industry,
              valuation:   data.overview?.value?.valuation,
              lastDeal:    data.overview?.value?.stage,
              addedAt:     new Date().toISOString(),
            })}
            isWatched={isWatched(data.companyName)}
          />
        )}
      </main>
    </>
  )
}

export default function MarketIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[var(--cp)] animate-spin" />
        </div>
      </div>
    }>
      <MarketIntelligenceContent />
    </Suspense>
  )
}
