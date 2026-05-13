import { NextResponse } from "next/server"
import { getFromCache, setInCache, cacheKey } from "@/lib/redis"
import type { MarketDeal, MarketNews } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FxTicker {
  pair:   string
  value:  string
  change: number | null
}

export interface ChartPoint {
  date:  string   // "Apr 7"
  value: number
}

export interface CryptoTicker {
  name:     string
  symbol:   string
  priceSgd: string
  change24h: number
  history:  ChartPoint[]
}

export interface SGInvestor {
  name:   string
  type:   string
  deals:  number
  color:  string
}

export interface SGMarketData {
  tickers:   FxTicker[]
  crypto:    CryptoTicker[]
  stiIndex:  { value: string; live: boolean; history: ChartPoint[] }
  brentOil:  { value: string; live: boolean; history: ChartPoint[] }
  deals:     MarketDeal[]
  news:      MarketNews[]
  investors: SGInvestor[]
  fetchedAt: string
  liveness:  { fx: boolean; crypto: boolean; market: boolean; deals: boolean; news: boolean; investors: boolean }
}

// ─── SG Companies list ────────────────────────────────────────────────────────
const SG_COMPANIES = [
  { name: "Nium",              pbId: "113844-16", sector: "Fintech"       },
  { name: "Ninja Van",         pbId: "109552-06", sector: "Logistics"     },
  { name: "Coda Payments",     pbId: "56401-12",  sector: "Fintech"       },
  { name: "Carousell",         pbId: "60283-18",  sector: "E-commerce"    },
  { name: "ShopBack",          pbId: "108346-96", sector: "E-commerce"    },
  { name: "PropertyGuru",      pbId: "88630-30",  sector: "PropTech"      },
  { name: "Funding Societies", pbId: "154309-24", sector: "Fintech"       },
  { name: "Biofourmis",        pbId: "163904-05", sector: "Health Tech"   },
  { name: "Aspire",            pbId: "102785-59", sector: "Fintech"       },
  { name: "StashAway",         pbId: "181176-67", sector: "Fintech"       },
  { name: "Proxtera",          pbId: "463440-88", sector: "AI / Trade"    },
  { name: "Homage",            pbId: "178355-17", sector: "Health Tech"   },
  { name: "Credolab",          pbId: "182862-19", sector: "Fintech"       },
  { name: "Validus Capital",   pbId: "498361-87", sector: "Fintech"       },
  { name: "Patsnap",           pbId: "90827-11",  sector: "AI / Deep Tech"},
]

// ─── Cohesive investor palette (warm → cool gradient) ─────────────────────────
const INVESTOR_COLORS = ["#ff5c35","#f97316","#eab308","#22c55e","#0ea5e9","#8b5cf6"]

const PB_KEY  = process.env.PITCHBOOK_API_KEY ?? ""
const PB_BASE = "https://api.pitchbook.com"

async function pbGet(path: string, params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  const res = await fetch(`${PB_BASE}${path}${qs ? "?" + qs : ""}`, {
    headers: { Authorization: PB_KEY, Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`PB ${res.status} ${path}`)
  return res.json()
}

// ─── FX Ticker ────────────────────────────────────────────────────────────────
async function fetchFx(): Promise<{ tickers: FxTicker[]; live: boolean }> {
  try {
    const res  = await fetch("https://api.frankfurter.app/latest?from=USD&to=SGD,MYR,IDR,EUR", { cache: "no-store" })
    const data = await res.json()
    const r    = data.rates as Record<string, number>
    const sgd  = r.SGD

    const tickers: FxTicker[] = [
      { pair: "USD/SGD", value: sgd.toFixed(4),                          change: null },
      { pair: "EUR/SGD", value: (sgd / r.EUR).toFixed(4),                change: null },
      { pair: "SGD/MYR", value: (r.MYR / sgd).toFixed(4),                change: null },
      { pair: "SGD/IDR", value: Math.round(r.IDR / sgd).toLocaleString(), change: null },
    ]
    return { tickers, live: true }
  } catch {
    return { tickers: [], live: false }
  }
}

// ─── Crypto (price + 30-day history) ─────────────────────────────────────────
async function fetchCrypto(): Promise<{ crypto: CryptoTicker[]; live: boolean }> {
  try {
    const [priceRes, btcHistRes, ethHistRes] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=sgd&include_24hr_change=true",
        { cache: "no-store" }
      ),
      fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=sgd&days=30&interval=daily",
        { cache: "no-store" }
      ),
      fetch(
        "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=sgd&days=30&interval=daily",
        { cache: "no-store" }
      ),
    ])
    const [priceData, btcHist, ethHist] = await Promise.all([
      priceRes.json(), btcHistRes.json(), ethHistRes.json(),
    ])

    const toPoints = (prices: [number, number][]): ChartPoint[] =>
      prices.map(([ts, val]) => ({
        date:  new Date(ts).toLocaleDateString("en-SG", { day: "numeric", month: "short" }),
        value: Math.round(val),
      }))

    const fmt = (n: number) => n >= 1000 ? `S$${(n / 1000).toFixed(1)}K` : `S$${n.toFixed(0)}`

    const crypto: CryptoTicker[] = [
      {
        name: "Bitcoin",  symbol: "BTC",
        priceSgd: fmt(priceData.bitcoin?.sgd ?? 0),
        change24h: priceData.bitcoin?.sgd_24h_change ?? 0,
        history: toPoints(btcHist.prices ?? []),
      },
      {
        name: "Ethereum", symbol: "ETH",
        priceSgd: fmt(priceData.ethereum?.sgd ?? 0),
        change24h: priceData.ethereum?.sgd_24h_change ?? 0,
        history: toPoints(ethHist.prices ?? []),
      },
    ]
    return { crypto, live: true }
  } catch {
    return { crypto: [], live: false }
  }
}

// ─── Market indices + 30-day history (Yahoo Finance) ─────────────────────────
async function fetchMarket(): Promise<{
  stiIndex: SGMarketData["stiIndex"]
  brentOil: SGMarketData["brentOil"]
  live: boolean
}> {
  try {
    const HEADERS = { "User-Agent": "Mozilla/5.0" }
    const [stiRes, brentRes] = await Promise.all([
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5ESTI?range=1mo&interval=1d",  { headers: HEADERS, cache: "no-store" }),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?range=1mo&interval=1d",  { headers: HEADERS, cache: "no-store" }),
    ])
    const [sti, brent] = await Promise.all([stiRes.json(), brentRes.json()])

    const toPoints = (result: {
      timestamp: number[]
      indicators: { quote: [{ close: (number | null)[] }] }
    }): ChartPoint[] => {
      const timestamps = result?.timestamp ?? []
      const closes     = result?.indicators?.quote?.[0]?.close ?? []
      return timestamps
        .map((ts, i) => ({
          date:  new Date(ts * 1000).toLocaleDateString("en-SG", { day: "numeric", month: "short" }),
          value: closes[i] ?? null,
        }))
        .filter((p): p is ChartPoint => p.value !== null)
    }

    const stiResult   = sti.chart?.result?.[0]
    const brentResult = brent.chart?.result?.[0]
    const stiVal      = stiResult?.meta?.regularMarketPrice
    const brentVal    = brentResult?.meta?.regularMarketPrice

    return {
      stiIndex: {
        value:   stiVal ? stiVal.toLocaleString("en-SG", { maximumFractionDigits: 2 }) : "—",
        live:    !!stiVal,
        history: stiResult ? toPoints(stiResult) : [],
      },
      brentOil: {
        value:   brentVal ? `$${brentVal.toFixed(2)}` : "—",
        live:    !!brentVal,
        history: brentResult ? toPoints(brentResult) : [],
      },
      live: !!(stiVal || brentVal),
    }
  } catch {
    return {
      stiIndex: { value: "—", live: false, history: [] },
      brentOil: { value: "—", live: false, history: [] },
      live: false,
    }
  }
}

// ─── PitchBook deals ──────────────────────────────────────────────────────────
async function fetchSGDeals(): Promise<{ deals: MarketDeal[]; live: boolean }> {
  if (!PB_KEY) return { deals: [], live: false }
  try {
    const companyDeals = await Promise.allSettled(
      SG_COMPANIES.map(async co => {
        const deals: Array<{ dealId: string; dealDate: string; dealType1: { description: string } }> =
          await pbGet(`/companies/${co.pbId}/deals`, { perPage: 1 })
        const latest = deals[deals.length - 1]
        if (!latest) return null

        let amountUsd: number | null = null
        try {
          const bio = await pbGet(`/deals/${latest.dealId}/bio`)
          amountUsd = bio.dealSize?.amount ?? bio.totalInvestedCapital?.amount ?? null
        } catch { /* ok */ }

        return {
          company:   co.name,
          type:      latest.dealType1?.description ?? "Private Equity",
          sector:    co.sector,
          amount:    amountUsd ? formatAmount(amountUsd) : "Undisclosed",
          amountSgd: amountUsd ? Math.round(amountUsd * 1.34) : 0,
          date:      latest.dealDate,
          isNew:     isRecent(latest.dealDate, 60),
        } as MarketDeal
      })
    )

    const deals = companyDeals
      .filter((r): r is PromiseFulfilledResult<MarketDeal | null> => r.status === "fulfilled" && r.value !== null)
      .map(r => r.value as MarketDeal)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)

    return { deals, live: deals.length > 0 }
  } catch {
    return { deals: [], live: false }
  }
}

// ─── PitchBook investors ──────────────────────────────────────────────────────
async function fetchSGInvestors(): Promise<{ investors: SGInvestor[]; live: boolean }> {
  if (!PB_KEY) return { investors: [], live: false }
  try {
    const results = await Promise.allSettled(
      SG_COMPANIES.map(co =>
        pbGet(`/companies/${co.pbId}/investors`, { perPage: 30 })
          .then((d: { investors: Array<{ investorName: string; investorTypes: Array<{ type: { description: string } }> }> }) => d.investors ?? [])
          .catch(() => [])
      )
    )

    const counts: Record<string, { name: string; type: string; deals: number }> = {}
    results
      .filter((r): r is PromiseFulfilledResult<typeof results[0] extends PromiseFulfilledResult<infer T> ? T : never> => r.status === "fulfilled")
      .flatMap(r => (r.value as Array<{ investorName: string; investorTypes: Array<{ type: { description: string } }> }>))
      .forEach(inv => {
        if (!inv.investorName) return
        if (!counts[inv.investorName]) {
          counts[inv.investorName] = {
            name:  inv.investorName,
            type:  inv.investorTypes?.[0]?.type?.description ?? "Investor",
            deals: 0,
          }
        }
        counts[inv.investorName].deals++
      })

    const investors: SGInvestor[] = Object.values(counts)
      .sort((a, b) => b.deals - a.deals)
      .slice(0, 6)
      .map((inv, i) => ({ ...inv, color: INVESTOR_COLORS[i % INVESTOR_COLORS.length] }))

    return { investors, live: investors.length > 0 }
  } catch {
    return { investors: [], live: false }
  }
}

// ─── NewsAPI ──────────────────────────────────────────────────────────────────
async function fetchSGNews(): Promise<{ news: MarketNews[]; live: boolean }> {
  const apiKey = process.env.NEWSAPI_KEY
  if (!apiKey) return { news: [], live: false }
  try {
    const domains = "techinasia.com,e27.co,straitstimes.com,businesstimes.com.sg,channelnewsasia.com,financeasia.com,fintechnews.sg"
    const res  = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent("fintech")}&domains=${domains}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`,
      { cache: "no-store" }
    )
    const data = await res.json()
    if (!res.ok || data.status !== "ok" || !data.articles?.length) return { news: [], live: false }

    const news: MarketNews[] = data.articles
      .filter((a: { title: string }) => a.title && a.title !== "[Removed]")
      .slice(0, 5)
      .map((a: { title: string; source: { name: string }; publishedAt: string; url: string }) => ({
        title: a.title, source: a.source?.name ?? "Unknown",
        publishedAt: a.publishedAt, url: a.url, sentiment: "neutral" as const,
      }))
    return { news, live: true }
  } catch {
    return { news: [], live: false }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAmount(usd: number): string {
  const sgd = usd * 1.34
  if (sgd >= 1_000_000_000) return `S$${(sgd / 1_000_000_000).toFixed(1)}B`
  if (sgd >= 1_000_000)     return `S$${Math.round(sgd / 1_000_000)}M`
  return `S$${Math.round(sgd / 1_000)}K`
}

function isRecent(d: string, days: number): boolean {
  return Date.now() - new Date(d).getTime() < days * 86_400_000
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse<SGMarketData>> {
  const key    = cacheKey.market()
  const cached = await getFromCache<SGMarketData>(key)
  if (cached) return NextResponse.json(cached)

  const [
    { tickers, live: fxLive },
    { crypto,  live: cryptoLive },
    { stiIndex, brentOil, live: marketLive },
    { deals,     live: dealsLive },
    { news,      live: newsLive  },
    { investors, live: investorsLive },
  ] = await Promise.all([
    fetchFx(), fetchCrypto(), fetchMarket(),
    fetchSGDeals(), fetchSGNews(), fetchSGInvestors(),
  ])

  const data: SGMarketData = {
    tickers, crypto, stiIndex, brentOil,
    deals, news, investors, fetchedAt: new Date().toISOString(),
    liveness: { fx: fxLive, crypto: cryptoLive, market: marketLive, deals: dealsLive, news: newsLive, investors: investorsLive },
  }

  await setInCache(key, data, 3600)
  return NextResponse.json(data)
}
