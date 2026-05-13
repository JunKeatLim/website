"use client"

import { useMarketData } from "@/hooks/useMarketData"
import { SectionCard, CardSkeleton } from "@/components/ui/primitives"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"
import type { ChartPoint } from "@/app/api/market/route"
import type { MarketDeal } from "@/types"
import theme, { p } from "@/lib/theme"

export function MarketPage({ onCompanyClick: _onCompanyClick }: { onCompanyClick: (name: string) => void }) {
  const { data, loading, error, refresh } = useMarketData()

  if (loading) return (
    <div className="p-4 md:p-7 w-full">
      <div className="flex gap-4">
        <div className="flex flex-col gap-4 flex-1"><CardSkeleton /><CardSkeleton /></div>
        <div className="flex flex-col gap-4 flex-1"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Failed to load market data</h2>
      <p className="text-sm text-gray-400">{error ?? "Unknown error"}</p>
      <button onClick={refresh} className="mt-4 h-10 px-4 rounded-full text-white text-sm font-bold transition-colors" style={{ background: theme.primary }}>
        Retry
      </button>
    </div>
  )

  const { liveness } = data
  const bitcoin = data.crypto.find(c => c.symbol === "BTC")

  return (
    <div className="flex flex-col h-full px-4 md:px-7 pt-4 md:pt-7 pb-4 gap-4 w-full">

      {/* ── Stat cards row ────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-shrink-0">
        <StatCard
          label="SGX Market"
          value={data.liveness.market ? "Open" : "Closed"}
          sub="Singapore Exchange"
          variant={data.liveness.market ? "navy" : "glass"}
          dot={data.liveness.market ? "green" : "gray"}
        />
        <StatCard
          label="STI Index"
          value={data.stiIndex.value}
          sub={(() => { const h = data.stiIndex.history; if (h.length < 2) return "30-day"; const t = h[h.length-1].value - h[0].value; return `${t >= 0 ? "▲" : "▼"} ${Math.abs(t).toFixed(2)} pts 30d` })()}
          variant="navy"
        />
        <StatCard
          label="BTC / SGD"
          value={bitcoin?.priceSgd ?? "—"}
          sub={bitcoin ? `${bitcoin.change24h >= 0 ? "▲" : "▼"} ${Math.abs(bitcoin.change24h).toFixed(2)}% 24h` : "Live"}
          variant="navy"
        />
        <StatCard
          label="News Today"
          value={String(data.news.length)}
          sub="SG FinTech articles"
          variant="glass"
        />
        <StatCard
          label="Recent Deals"
          value={String(data.deals.length)}
          sub="Funding rounds"
          variant="navy"
        />
      </div>

      {/* ── Staggered grid — fills remaining height ───────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">

        {/* ── Left column: News (capped) + STI Index (stretches) ─────────── */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">

          {/* News — capped height, scrolls internally */}
          <SectionCard
            title="Singapore FinTech News"
            action={<LiveBadge live={liveness.news} source="NewsAPI" />}
            className="flex-shrink-0"
            variant="navy"
          >
            {data.news.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-white/40">No news data available</div>
            ) : (
              <div className="overflow-y-auto max-h-[220px]">
                {data.news.map((a, i) => (
                  <a
                    key={i}
                    href={a.url ?? `https://news.google.com/search?q=${encodeURIComponent(a.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 flex-shrink-0 mt-0.5 group-hover:bg-white/20 transition-colors">
                      {a.source.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white/95 leading-snug mb-1">
                        {a.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/65 flex-wrap">
                        <span>{a.source}</span>
                        <span>·</span>
                        <span>{fmtAgo(a.publishedAt)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${{ positive: "bg-white/10 text-green-400", neutral: "bg-white/10 text-white/50", negative: "bg-white/10 text-red-400" }[a.sentiment]}`}>
                          {a.sentiment}
                        </span>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-white/35 group-hover:text-white/70 flex-shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                      <path d="M3 13L13 3M13 3H7M13 3v6" />
                    </svg>
                    {i < data.news.length - 1 && (
                      <span className="pointer-events-none absolute bottom-0 left-5 right-5 h-px bg-white/8" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </SectionCard>

          {/* STI Index — stretches to fill left column */}
          <SectionCard
            title="STI Index"
            sub="Straits Times Index · 30-day"
            action={<LiveBadge live={liveness.market} source="Yahoo Finance" />}
            className="flex-1 min-h-0"
            childrenClassName="flex flex-col flex-1 min-h-0"
            glass
          >
            <IndexChartTile
              value={data.stiIndex.value}
              live={data.stiIndex.live}
              history={data.stiIndex.history}
              color="#3b82f6"
            />
          </SectionCard>

        </div>

        {/* ── Right column: Brent (stretches) + Investors (capped) ── */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">

          {/* Brent Oil — stretches to fill right column */}
          <SectionCard
            title="Brent Oil"
            sub="BZ=F futures · 30-day"
            action={<LiveBadge live={liveness.market} source="Yahoo Finance" />}
            className="flex-1 min-h-0"
            childrenClassName="flex flex-col flex-1 min-h-0"
            glass
          >
            <IndexChartTile
              value={data.brentOil.value}
              live={data.brentOil.live}
              history={data.brentOil.history}
              color="#f59e0b"
              suffix="/bbl"
            />
          </SectionCard>

          {/* Recent SG Deals — capped, scrolls internally */}
          <SectionCard
            title="Recent SG Deals"
            sub="Latest funding rounds & transactions"
            action={<LiveBadge live={liveness.deals} source="PitchBook" />}
            className="flex-shrink-0"
            variant="navy"
          >
            {data.deals.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-white/40">No deal data available</div>
            ) : (
              <div className="overflow-y-auto max-h-[240px]">
                {data.deals.map((deal, i) => (
                  <DealRow key={i} deal={deal} isLast={i === data.deals.length - 1} />
                ))}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  )
}

// ─── Chart tiles ──────────────────────────────────────────────────────────────

function IndexChartTile({
  value, live, history, color, suffix = "",
}: {
  value: string; live: boolean; history: ChartPoint[]; color: string; suffix?: string
}) {
  const trend = history.length >= 2
    ? history[history.length - 1].value - history[0].value
    : 0
  const up = trend >= 0

  const n = history.length
  const xTicks = n >= 2
    ? [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n - 1]
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(i => history[i].date)
    : []

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-end gap-3 px-5 pt-4 pb-2 flex-shrink-0">
        <div className={`text-[26px] font-black tabular-nums leading-none ${live ? "text-gray-900" : "text-gray-300"}`}>
          {value}{suffix}
        </div>
        {history.length >= 2 && (
          <div className={`flex items-center gap-0.5 text-[12px] font-bold mb-0.5 ${up ? "text-green-600" : "text-red-500"}`}>
            <span>{up ? "▲" : "▼"}</span>
            <span>{Math.abs(trend).toFixed(2)}</span>
            <span className="text-[10px] font-normal opacity-70 ml-0.5">30d</span>
          </div>
        )}
      </div>
      {history.length > 1 && (
        <div className="flex-1 min-h-[120px] w-full pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" ticks={xTicks} tick={{ fontSize: 9, fill: "#b0aaa3" }} tickLine={false} axisLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#b0aaa3" }} tickLine={false} axisLine={false} width={42}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                labelStyle={{ fontWeight: 700, color: "#374151" }}
                itemStyle={{ color }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${Number(v).toLocaleString("en-SG", { maximumFractionDigits: 2 })}${suffix}`, ""]}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                fill={`url(#grad-${color.replace("#", "")})`} dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}


// ─── Deal row ─────────────────────────────────────────────────────────────────

function dealTypeBadgeClass(type: string): string {
  const t = type.toLowerCase()
  if (t.includes("seed") || t.includes("angel") || t.includes("grant") || t.includes("pre-seed"))
    return "bg-violet-400/20 text-violet-300"
  if (t.includes("series") || t.includes("stage vc") || t.includes("venture") || t.includes("growth"))
    return "bg-blue-400/20 text-blue-300"
  if (t.includes("ipo") || t.includes("spac") || t.includes("public"))
    return "bg-amber-400/20 text-amber-300"
  if (t.includes("m&a") || t.includes("acqui") || t.includes("merger") || t.includes("secondary"))
    return "bg-rose-400/20 text-rose-300"
  if (t.includes("corporate") || t.includes("strategic"))
    return "bg-teal-400/20 text-teal-300"
  return "bg-white/10 text-white/75"
}

function DealRow({ deal, isLast = false }: { deal: MarketDeal; isLast?: boolean }) {
  return (
    <div className="relative flex items-center gap-3 px-5 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-white truncate">{deal.company}</span>
          {deal.isNew && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 flex-shrink-0">NEW</span>}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/65">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dealTypeBadgeClass(deal.type)}`}>{deal.type}</span>
          <span>·</span>
          <span>{deal.sector}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-[13px] font-bold ${deal.amount === "Undisclosed" ? "text-white/50" : "text-white"}`}>
          {deal.amount}
        </div>
        <div className="text-[10px] text-white/65">{new Date(deal.date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}</div>
      </div>
      {!isLast && <span className="pointer-events-none absolute bottom-0 left-5 right-5 h-px bg-white/8" />}
    </div>
  )
}

// ─── Live badges ──────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  )
}

function LiveBadge({ live, source }: { live: boolean; source: string }) {
  return live ? (
    <div className="flex items-center gap-1.5">
      <LiveDot />
      <span className="text-[10px] font-bold text-green-600">{source} · Live</span>
    </div>
  ) : (
    <span className="text-[10px] font-bold text-gray-400">{source} · Unavailable</span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

type StatVariant = "navy" | "glass" | "white"

function StatCard({ label, value, sub, variant, dot }: {
  label: string; value: string; sub?: string; variant: StatVariant; dot?: "green" | "gray"
}) {
  const isNavy = variant === "navy"

  const bg = isNavy ? theme.primary
    : variant === "glass" ? "rgba(255,255,255,0.6)"
    : "#ffffff"

  const textColor = isNavy ? "#ffffff" : theme.primary
  const subColor  = isNavy ? "rgba(255,255,255,0.5)" : p(0.4)
  const shadow    = isNavy ? `0 4px 20px ${p(0.22)}` : "0 2px 8px rgba(0,0,0,0.04)"
  const border    = isNavy ? "none" : variant === "glass"
    ? "1px solid rgba(255,255,255,0.72)" : `1px solid ${p(0.07)}`

  return (
    <div style={{
      flex: 1, minWidth: 0, borderRadius: 16, padding: "13px 18px",
      background: bg,
      backdropFilter: variant === "glass" ? "blur(20px) saturate(160%)" : undefined,
      WebkitBackdropFilter: variant === "glass" ? "blur(20px) saturate(160%)" : undefined,
      border, boxShadow: shadow,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        {dot && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: dot === "green" ? "#22c55e" : "#9ca3af",
          }} />
        )}
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: subColor }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: subColor, marginTop: 5, fontWeight: 500 }}>{sub}</div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (h < 1)  return "Just now"
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-SG")
}
