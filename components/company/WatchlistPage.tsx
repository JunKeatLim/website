"use client"

import { Plus, X, Star } from "lucide-react"
import { SectionCard } from "@/components/ui/primitives"
import { useWatchlist } from "@/hooks"
import theme, { p } from "@/lib/theme"

export function WatchlistPage({ onCompanyClick, onNewSearch }: { onCompanyClick: (n: string) => void; onNewSearch: () => void }) {
  const { items, remove } = useWatchlist()

  return (
    <div className="p-7 pb-12 space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

        <SectionCard
          title="Your Watchlist"
          sub={items.length > 0 ? `${items.length} ${items.length === 1 ? "company" : "companies"} tracked` : "No companies yet"}
          action={
            <button
              onClick={onNewSearch}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-85"
              style={{ background: theme.primary }}
            >
              <Plus size={12} /> Add Company
            </button>
          }
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-[#f8f6f2] flex items-center justify-center text-2xl mb-4">
                <Star size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Your watchlist is empty</p>
              <p className="text-xs text-gray-400 mb-5">Search for a company and click "Watchlist" to track it here.</p>
              <button
                onClick={onNewSearch}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white transition-all hover:opacity-85"
                style={{ background: theme.primary }}
              >
                Search a company
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(co => (
                <div
                  key={co.companyName}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f6f2] transition-colors group"
                >
                  {/* Avatar */}
                  <button
                    className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0 hover:bg-[var(--cp)]/10 hover:text-[var(--cp)] transition-colors"
                    onClick={() => onCompanyClick(co.companyName)}
                    title={`View ${co.companyName}`}
                  >
                    {co.companyName[0].toUpperCase()}
                  </button>

                  {/* Info */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => onCompanyClick(co.companyName)}
                  >
                    <div className="text-sm font-bold text-gray-900">{co.companyName}</div>
                    <div className="text-[11px] text-gray-400">
                      {[co.industry, co.lastDeal].filter(Boolean).join(" · ")}
                    </div>
                  </button>

                  {/* Valuation */}
                  {co.valuation && (
                    <div className="text-sm font-bold text-gray-900 w-16 text-right flex-shrink-0">
                      {co.valuation}
                    </div>
                  )}

                  {/* Added date */}
                  <div className="text-[10.5px] text-gray-400 w-20 text-right flex-shrink-0 hidden sm:block">
                    {new Date(co.addedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => remove(co.companyName)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    title="Remove from watchlist"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Right panel */}
        <div className="space-y-5">
          <SectionCard title="Watchlist summary">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Companies tracked</span>
                <span className="text-sm font-bold text-gray-900">{items.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Latest added</span>
                <span className="text-sm font-bold text-gray-900 truncate max-w-[140px] text-right">
                  {items[0]?.companyName ?? "—"}
                </span>
              </div>
              {items.length > 0 && (
                <div className="pt-2 border-t border-gray-50">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(items.map(i => i.industry).filter(Boolean))).slice(0, 5).map(ind => (
                      <span key={ind} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="How to use">
            <div className="p-5 space-y-3">
              {[
                ["🔍", "Search any company in Market Intelligence"],
                ["⭐", 'Click "Watchlist" on the company profile'],
                ["📋", "Return here to track all your companies"],
                ["✕",  "Hover a row and click × to remove"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">{icon}</span>
                  <span className="text-xs text-gray-500 leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
