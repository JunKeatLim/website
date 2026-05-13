"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false })
import { Star, Download, Globe, RotateCw } from "lucide-react"

function CompanyLogo({ name, domain }: { name: string; domain?: string }) {
  const [failed, setFailed] = useState(false)
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setFailed(true)}
        className="w-16 h-16 rounded-2xl object-cover shadow-sm"
      />
    )
  }

  return (
    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-3xl font-black flex-shrink-0" style={{ color: theme.primary }}>
      {name[0]}
    </div>
  )
}
import type { CompanySummary } from "@/types"
import { SectionCard, FreshnessPill, StaleBanner, Skeleton, cn } from "@/components/ui/primitives"
import { exportCompanyPdf } from "@/lib/exportPdf"
import theme, { p } from "@/lib/theme"

type Tab = "overview" | "investors" | "deals" | "news" | "contact" | "datahealth"
const TABS: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview"          },
  { id: "investors",   label: "Investors"         },
  { id: "deals",       label: "Deals"             },
  { id: "news",        label: "News"              },
  { id: "contact",     label: "Contact & Location"},
  { id: "datahealth",  label: "Data Health"       },
]

interface Props {
  data: CompanySummary
  loading?: boolean
  onWatchlist?: () => void
  isWatched?: boolean
}

export function CompanyPage({ data, loading, onWatchlist, isWatched }: Props) {
  const [tab, setTab] = useState<Tab>("overview")
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [newsMeta, setNewsMeta] = useState(data.news.meta)

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      await exportCompanyPdf(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setExportError(msg.includes("quota") ? "OpenAI quota exceeded — check your billing at platform.openai.com." : "Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <CompanySkeleton />

  const ov = data.overview.value

  return (
    <div className="p-7 pb-12 space-y-5">
      {/* Company header */}
      <div className="flex gap-5 items-start">
        <CompanyLogo name={data.companyName} domain={data.domain} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight mb-2">{data.companyName}</h1>
          <div className="flex gap-2 flex-wrap mb-2">
            {[...new Set([ov?.industry, ...(ov?.tags ?? [])].filter(Boolean))].map(t => <Tag key={t} color="orange">{t}</Tag>)}
            <Tag color="gray">Private</Tag>
            {ov?.founded  && <Tag color="gray">Est. {ov.founded}</Tag>}
          </div>
          {ov?.description && <p className="text-sm text-gray-500 max-w-xl leading-relaxed">{ov.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {exportError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 max-w-xs text-right">
              ⚠️ {exportError}
            </div>
          )}
          <div className="flex gap-2">
          <button
            onClick={onWatchlist}
            className={cn(
              "group flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold border transition-all duration-200",
              isWatched
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                : "bg-white border-gray-100 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 hover:shadow-sm"
            )}
          >
            <Star
              size={13}
              fill={isWatched ? "currentColor" : "none"}
              className={cn(
                "transition-transform duration-200",
                isWatched ? "group-hover:scale-90" : "group-hover:scale-125 group-hover:fill-amber-400"
              )}
            />
            <span className="transition-all duration-200">
              {isWatched ? <span className="group-hover:hidden">Watching</span> : "Watchlist"}
              {isWatched && <span className="hidden group-hover:inline">Remove</span>}
            </span>
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold text-white border-none transition-all hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: theme.primary }}
          >
            {exporting ? (
              <>
                <svg className="animate-spin" width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Generating…
              </>
            ) : (
              <><Download size={13} /> Export PDF</>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Valuation",    value: ov?.valuation ?? "—",   sub: "Post-money"         },
          { label: "Total raised", value: ov?.totalRaised ?? "—", sub: `${data.deals.value?.length ?? 0} rounds` },
          { label: "Employees",    value: ov?.employees ? Number(ov.employees).toLocaleString("fr-FR") : "—", sub: "Global headcount" },
          { label: "Last deal",    value: fmtMonthYear(data.deals.value?.[0]?.date), sub: data.deals.value?.[0]?.round ?? "" },
          { label: "Industry",     value: ov?.sector ?? ov?.industry ?? "—", sub: ov?.industry ?? "" },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{m.label}</div>
            <div className="text-xl font-bold text-gray-900 leading-tight">{m.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-gray-100">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 mb-[-2px]", tab === t.id ? "text-indigo-600 border-indigo-500" : "text-gray-400 border-transparent hover:text-gray-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === "overview"   && <OverviewTab   data={data} />}
      {tab === "investors"  && <InvestorsTab  data={data} />}
      {tab === "deals"      && <DealsTab      data={data} />}
      {tab === "news"       && <NewsTab       data={data} newsMeta={newsMeta} onNewsMeta={setNewsMeta} />}
      {tab === "contact"    && <ContactTab    data={data} />}
      {tab === "datahealth" && <DataHealthTab data={data} newsMeta={newsMeta} />}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: CompanySummary }) {
  const ov = data.overview.value
  return (
    <div className="grid grid-cols-[1fr_300px] gap-5">
      <div className="space-y-5">
        <SectionCard title="About" action={<FreshnessPill meta={data.overview.meta} fieldName="overview" />}>
          <div className="px-5 py-4 text-sm text-gray-600 leading-relaxed space-y-3">
            <p>{ov?.description ?? "No description available."}</p>
          </div>
        </SectionCard>
        <SectionCard title="Key figures" action={<FreshnessPill meta={data.overview.meta} fieldName="overview" />}>
          <div className="divide-y divide-gray-50">
            {[["Website", ov?.website], ["Industry", ov?.industry], ["Sector", ov?.sector], ["Stage", ov?.stage], ["Founded", ov?.founded]].filter(([,v]) => v).map(([k, v]) => (
              <div key={String(k)} className="flex justify-between items-center px-5 py-2.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{k}</span>
                <span className="text-[13px] font-semibold text-gray-800">{String(v)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <DataHealthMini data={data} />
    </div>
  )
}

// ─── Investors ────────────────────────────────────────────────────────────────
function InvestorsTab({ data }: { data: CompanySummary }) {
  const investors = data.investors.value ?? []
  return (
    <SectionCard title="Investor list" action={<FreshnessPill meta={data.investors.meta} fieldName="investors" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f6f2]">
            <tr>{["Investor","Type","Rounds","Lead","Confidence"].map(h => <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-2.5 border-b border-gray-100">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {investors.length === 0
              ? <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No investor data available</td></tr>
              : investors.map((inv, i) => (
                  <tr key={i} className="hover:bg-[#f8f6f2] transition-colors">
                    <td className="px-5 py-3"><div className="font-bold text-gray-900">{inv.name}</div><div className="text-[10.5px] text-gray-400">{inv.type}</div></td>
                    <td className="px-5 py-3 text-gray-600">{inv.type}</td>
                    <td className="px-5 py-3">{inv.rounds.map(r => <span key={r} className="inline-block text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-1">{r}</span>)}</td>
                    <td className="px-5 py-3 text-gray-600">{inv.isLead ? "Yes" : "No"}</td>
                    <td className="px-5 py-3"><div className="text-xs font-bold text-gray-700">{(inv.confidenceScore*100).toFixed(0)}%</div><div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${inv.confidenceScore*100}%` }} /></div></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

// ─── Deals ────────────────────────────────────────────────────────────────────
function DealsTab({ data }: { data: CompanySummary }) {
  const deals = data.deals.value ?? []
  const isStale = data.deals.meta.status !== "fresh"
  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      <SectionCard title="Funding timeline" action={<FreshnessPill meta={data.deals.meta} fieldName="deals" />}>
        {isStale && <StaleBanner message={`Deal data is ${data.deals.meta.status} — last fetched ${data.deals.meta.ageDays}d ago`} />}
        <div className="p-5 space-y-0">
          {deals.length === 0
            ? <div className="text-center text-gray-400 py-8">No deal data available</div>
            : deals.map((deal, i) => (
              <div key={i} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-[0_0_0_2px] mt-0.5 flex-shrink-0 ${i === 0 ? "bg-indigo-500 shadow-indigo-400" : "bg-gray-300 shadow-gray-300"}`} />
                  {i < deals.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                </div>
                <div className="flex-1 pb-0">
                  <div className={`text-xs font-bold mb-0.5 ${i === 0 ? "text-indigo-600" : "text-gray-400"}`}>{deal.round}</div>
                  <div className="text-xl font-black text-gray-900 tracking-tight">{deal.amount}</div>
                  <div className="text-xs text-gray-500 mt-1">{deal.date}{deal.postMoneyValuation ? ` · Post-money: ${deal.postMoneyValuation}` : ""}</div>
                  {deal.leadInvestors.length > 0 && <div className="text-[11px] text-gray-400 mt-0.5">Lead: {deal.leadInvestors.join(", ")}</div>}
                </div>
              </div>
            ))
          }
        </div>
      </SectionCard>
      <SectionCard title="Deal summary">
        <div className="divide-y divide-gray-50">
          {[["Total rounds", String(deals.length)], ["Total raised", data.overview.value?.totalRaised ?? "—"], ["Latest round", deals[0]?.round ?? "—"], ["Latest date", deals[0]?.date ?? "—"], ["Peak valuation", "—"], ["Current val.", data.overview.value?.valuation ?? "—"]].map(([k,v]) => (
            <div key={k} className="flex justify-between items-center px-5 py-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{k}</span>
              <span className="text-[13px] font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── News ─────────────────────────────────────────────────────────────────────
function NewsTab({ data, newsMeta, onNewsMeta }: { data: CompanySummary; newsMeta: CompanySummary["news"]["meta"]; onNewsMeta: (m: CompanySummary["news"]["meta"]) => void }) {
  const [refreshing, setRefreshing] = useState(false)
  const [articles, setArticles] = useState(data.news.value ?? [])
  const sentColor = { positive: "bg-green-50 text-green-700", neutral: "bg-gray-100 text-gray-500", negative: "bg-red-50 text-red-700" }
  const sentiment = articles.reduce((a, n) => { a[n.sentiment] = (a[n.sentiment]||0)+1; return a }, {} as Record<string,number>)
  const total = articles.length || 1

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch("/api/company/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: data.companyName }),
      })
      const json = await res.json()
      if (json.data?.news?.value) setArticles(json.data.news.value)
      if (json.data?.news?.meta)  onNewsMeta(json.data.news.meta)
    } catch (err) {
      console.error("[NewsTab] refresh failed:", err)
    } finally {
      setRefreshing(false)
    }
  }

  const refreshButton = (
    <div className="flex items-center gap-3">
      <FreshnessPill meta={newsMeta} fieldName="news" />
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
        title="Refresh news"
      >
        <RotateCw size={12} className={refreshing ? "animate-spin" : ""} />
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  )

  return (
    <div className="grid grid-cols-[1fr_240px] gap-5">
      <SectionCard title="Latest news" action={refreshButton}>
        <div className="divide-y divide-gray-50">
          {articles.length === 0
            ? <div className="px-5 py-8 text-center text-gray-400">No news data available</div>
            : articles.map((a, i) => (
              <a
                key={i}
                href={a.url ?? `https://news.google.com/search?q=${encodeURIComponent(a.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 px-5 py-3 hover:bg-[#f8f6f2] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">{a.source.slice(0,2).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 leading-snug mb-1 group-hover:underline">{a.title}</div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
                    <span>{a.source}</span><span>·</span><span>{a.publishedAt.substring(0,10)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sentColor[a.sentiment]}`}>{a.sentiment}</span>
                  </div>
                </div>
              </a>
            ))
          }
        </div>
      </SectionCard>
      <SectionCard title="Sentiment">
        <div className="p-5 space-y-4">
          {(["positive","neutral","negative"] as const).map(s => (
            <div key={s}>
              <div className="flex justify-between text-xs font-bold mb-1.5"><span className="text-gray-500 capitalize">{s}</span><span className={{positive:"text-green-600",neutral:"text-gray-500",negative:"text-red-600"}[s]}>{Math.round(((sentiment[s]||0)/total)*100)}%</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${((sentiment[s]||0)/total)*100}%`, background: {positive:"#22c55e",neutral:"#9ca3af",negative:"#ef4444"}[s] }} /></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Contact & Location ───────────────────────────────────────────────────────
function ContactTab({ data }: { data: CompanySummary }) {
  const contact  = data.contact.value
  const location = data.location.value
  return (
    <div className="grid grid-cols-3 gap-5">
      <SectionCard title="Main contact" action={<FreshnessPill meta={data.contact.meta} fieldName="contact" />}>
        <div className="p-5">
          <div className="flex gap-3 items-center mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0" style={{ background: p(0.1), color: theme.primary }}>
              {contact?.name?.split(" ").map(w => w[0]).join("").slice(0,2) ?? "?"}
            </div>
            <div><div className="text-base font-bold text-gray-900">{contact?.name ?? "Unavailable"}</div><div className="text-xs text-gray-500">{contact?.title ?? "—"}</div></div>
          </div>
          <div className="space-y-2.5">
            {contact?.email    && <ContactRow icon={<Globe size={13}/>} label="Email" value={contact.email} link={`mailto:${contact.email}`} />}
            {contact?.linkedin && <ContactRow icon={<Globe size={13}/>} label="LinkedIn" value="View profile" link={contact.linkedin} />}
            {contact?.twitter  && <ContactRow icon={<Globe size={13}/>} label="Twitter" value={contact.twitter} link={`https://twitter.com/${contact.twitter}`} />}
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Location" action={<FreshnessPill meta={data.location.meta} fieldName="location" />}>
        <div className="p-5">
          {(() => {
            const query = [location?.address, location?.city, location?.country].filter(Boolean).join(", ")
            const mapsUrl = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "https://www.google.com/maps"
            const hasLocation = !!(location?.city || location?.country)
            return (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block h-40 rounded-xl border border-gray-100 mb-4 relative overflow-hidden group cursor-pointer hover:border-gray-200 transition-colors">
                {hasLocation ? (
                  <LocationMap address={location?.address} city={location?.city} country={location?.country} />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">No location data</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] text-gray-500 group-hover:text-gray-800 font-medium transition-colors shadow-sm" style={{ zIndex: 1000 }}>Open in Maps ↗</div>
              </a>
            )
          })()}
          <div className="text-sm font-bold text-gray-900 mb-1">{location?.city ?? "Unknown"}{location?.country ? `, ${location.country}` : ""}</div>
          {location?.address && <div className="text-xs text-gray-500 mb-3">{location.address}</div>}
          <div className="space-y-1.5">
            {[["Country", location?.country], ["Region", location?.region]].filter(([,v]) => v).map(([k,v]) => (
              <div key={String(k)} className="flex justify-between text-xs"><span className="text-gray-400">{k}</span><span className="font-semibold text-gray-700">{String(v)}</span></div>
            ))}
          </div>
          {data.location.meta.status === "expired" && <div className="mt-3 text-[11px] text-red-600 font-semibold">Location data expired — refresh needed</div>}
        </div>
      </SectionCard>
      <DataHealthMini data={data} />
    </div>
  )
}

function ContactRow({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0"><div className="text-[10px] text-gray-400">{label}</div>
        {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline truncate block">{value}</a>
               : <div className="text-xs font-semibold text-gray-800 truncate">{value}</div>}
      </div>
    </div>
  )
}

// ─── Data Health ──────────────────────────────────────────────────────────────
function DataHealthTab({ data, newsMeta }: { data: CompanySummary; newsMeta: CompanySummary["news"]["meta"] }) {
  const fields = [
    { key: "overview",  label: "Company overview", meta: data.overview.meta  },
    { key: "investors", label: "Investors",         meta: data.investors.meta },
    { key: "deals",     label: "Deal details",      meta: data.deals.meta    },
    { key: "news",      label: "News",              meta: newsMeta           },
    { key: "contact",   label: "Main contact",      meta: data.contact.meta  },
    { key: "location",  label: "Location",          meta: data.location.meta },
  ]
  const fresh = fields.filter(f => f.meta.status === "fresh").length
  const pct = Math.round((fresh / fields.length) * 100)

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      <SectionCard title="Field-level provenance" sub="Click any badge to expand">
        <div className="divide-y divide-gray-50">
          {fields.map(f => (
            <div key={f.key} className="flex items-center justify-between px-5 py-3 gap-3">
              <div><div className="text-sm font-semibold text-gray-900">{f.label}</div><div className="text-[10.5px] text-gray-400 mt-0.5">{f.meta.sourceName} · {f.meta.sourceTier}</div></div>
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] text-gray-400">{f.meta.ageDays}d ago</span>
                <FreshnessPill meta={f.meta} fieldName={f.key} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Overall health">
          <div className="p-5">
            <div className="flex justify-between text-sm font-semibold mb-2"><span className="text-gray-600">Freshness score</span><span className="text-green-600">{pct}%</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${pct}%` }} /></div>
            <div className="flex gap-4 mt-3 flex-wrap">
              {[["#16a34a", `${fields.filter(f=>f.meta.status==="fresh").length} fresh`], ["#f59e0b", `${fields.filter(f=>f.meta.status==="stale").length} stale`], ["#ef4444", `${fields.filter(f=>f.meta.status==="expired").length} expired`]].map(([color, label]) => (
                <div key={String(label)} className="flex items-center gap-1.5 text-[10.5px] text-gray-500 font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: String(color) }} />{label}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Raw envelope">
          <div className="p-4 font-mono text-[11px] text-gray-500 leading-relaxed overflow-x-auto">
            <span className="text-gray-400">{"{"}</span><br/>
            {`  `}<span className="text-green-600">"field"</span>: <span className="text-blue-600">"investors"</span>,<br/>
            {`  `}<span className="text-green-600">"source"</span>: <span className="text-blue-600">"{data.investors.meta.sourceName}"</span>,<br/>
            {`  `}<span className="text-green-600">"status"</span>: <span className="text-blue-600">"{data.investors.meta.status}"</span>,<br/>
            {`  `}<span className="text-green-600">"confidence"</span>: <span className="text-amber-600">{data.investors.meta.confidenceScore}</span>,<br/>
            {`  `}<span className="text-green-600">"age_days"</span>: <span className="text-amber-600">{data.investors.meta.ageDays}</span><br/>
            <span className="text-gray-400">{"}"}</span>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ─── Data health mini card ────────────────────────────────────────────────────
function DataHealthMini({ data }: { data: CompanySummary }) {
  const fields = [data.overview, data.investors, data.deals, data.news, data.contact, data.location]
  const fresh = fields.filter(f => f.meta.status === "fresh").length
  const pct = Math.round((fresh / fields.length) * 100)
  return (
    <SectionCard title="Data Health">
      <div className="p-5">
        <div className="flex justify-between text-sm font-semibold mb-2"><span className="text-gray-600">Freshness</span><span className="text-green-600">{pct}%</span></div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${pct}%` }} /></div>
        {fields.map((f, i) => {
          const labels = ["Overview","Investors","Deals","News","Contact","Location"]
          const dotColor = { fresh: "bg-green-400", stale: "bg-amber-400", expired: "bg-red-400", missing: "bg-gray-300" }
          return (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-[11px] text-gray-500">{labels[i]}</span>
              <span className={`w-2 h-2 rounded-full ${dotColor[f.meta.status]}`} />
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMonthYear(dateStr?: string): string {
  if (!dateStr) return "—"
  // Handles "2024-06" or "2024-06-04"
  const [year, month] = dateStr.split("-")
  if (!year || !month) return dateStr
  const d = new Date(Number(year), Number(month) - 1)
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
function Tag({ children, color }: { children: React.ReactNode; color: "orange"|"blue"|"gray" }) {
  const s = { orange: "bg-orange-50 text-orange-600", blue: "bg-blue-50 text-blue-600", gray: "bg-gray-100 text-gray-500" }
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s[color]}`}>{children}</span>
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CompanySkeleton() {
  return (
    <div className="p-7 space-y-5">
      <div className="flex gap-5 items-start">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-96" /></div>
      </div>
      <div className="grid grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-5"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
    </div>
  )
}
