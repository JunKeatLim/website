import type { NewsArticle } from "@/types"

// ─── Clearbit autocomplete (free, no key required) ───────────────────────────
export interface ClearbitMatch {
  name:   string
  domain: string
  logo:   string | null
}

export async function clearbitSearch(query: string): Promise<ClearbitMatch | null> {
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const results: ClearbitMatch[] = await res.json()
    if (!results?.length) return null

    // Pick exact name match first, else first result
    const exact = results.find(r => r.name.toLowerCase() === query.toLowerCase())
    return exact ?? results[0]
  } catch (err) {
    console.error("[Clearbit] autocomplete error:", err)
    return null
  }
}

// ─── Mock news — used when NEWSAPI_KEY is not set ────────────────────────────
export function getMockNews(companyName: string): NewsArticle[] {
  return [
    {
      title: `${companyName} expands operations in Southeast Asia`,
      source: "Business Times",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "positive",
      summary: `${companyName} announces plans to strengthen its presence across SEA markets.`,
    },
    {
      title: `${companyName} reports strong Q1 2026 growth`,
      source: "Straits Times",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "positive",
      summary: "Revenue and user growth metrics exceeded analyst expectations.",
    },
    {
      title: `Investors watch ${companyName} ahead of potential funding round`,
      source: "Bloomberg",
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "neutral",
      summary: "Market sources suggest a new funding round may be in preparation.",
    },
  ]
}

// ─── Fetch real news from NewsAPI.org ────────────────────────────────────────
const SG_SEA_DOMAINS = [
  "techinasia.com", "e27.co", "straitstimes.com", "businesstimes.com.sg",
  "channelnewsasia.com", "financeasia.com", "fintechnews.sg", "dealstreetasia.com",
  "theedgesingapore.com", "nikkei.com", "reuters.com", "bloomberg.com",
].join(",")

type RawArticle = {
  title:       string
  source:      { name: string }
  publishedAt: string
  url:         string
  description: string | null
}

function parseArticles(articles: RawArticle[]): NewsArticle[] {
  return articles
    .filter(a => a.title && a.title !== "[Removed]")
    .map(a => ({
      title:       a.title,
      source:      a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt,
      url:         a.url,
      sentiment:   "neutral" as const,
      summary:     a.description ?? undefined,
    }))
}

async function queryNewsApi(
  q: string,
  apiKey: string,
  opts: { domains?: string; sortBy?: "relevancy" | "publishedAt" } = {}
): Promise<RawArticle[]> {
  const params = new URLSearchParams({
    q,
    language: "en",
    pageSize: "5",
    sortBy:   opts.sortBy ?? "relevancy",
    apiKey,
    ...(opts.domains ? { domains: opts.domains } : {}),
  })
  const res  = await fetch(`https://newsapi.org/v2/everything?${params}`, { next: { revalidate: 3600 } })
  const data = await res.json()
  if (!res.ok || data.status !== "ok") {
    console.warn("[NewsAPI] query failed:", data.message)
    return []
  }
  return data.articles ?? []
}

export async function fetchNews(
  companyName: string,
  opts: { domain?: string; industry?: string } = {}
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY
  if (!apiKey) {
    console.warn("[NewsAPI] Key not set — using mock data")
    return getMockNews(companyName)
  }

  // Build a disambiguating context term (industry or "Singapore")
  const context = opts.industry ?? "Singapore"

  // Strategy 1: exact name + context, restricted to SG/SEA publications
  try {
    const q1       = `"${companyName}" ${context}`
    const articles = await queryNewsApi(q1, apiKey, { domains: SG_SEA_DOMAINS })
    const parsed   = parseArticles(articles)
    if (parsed.length >= 1) {
      console.log(`[NewsAPI] Strategy 1 hit (${parsed.length} articles): ${q1}`)
      return parsed
    }
  } catch (err) { console.warn("[NewsAPI] Strategy 1 error:", err) }

  // Strategy 2: exact name + context, global (keeps disambiguation, removes domain filter)
  try {
    const q2       = `"${companyName}" ${context}`
    const articles = await queryNewsApi(q2, apiKey)
    const parsed   = parseArticles(articles)
    if (parsed.length >= 1) {
      console.log(`[NewsAPI] Strategy 2 hit (${parsed.length} articles): ${q2}`)
      return parsed
    }
  } catch (err) { console.warn("[NewsAPI] Strategy 2 error:", err) }

  // Strategy 3: domain-based search (most precise for ambiguous names like "Stripe", "Grab")
  if (opts.domain) {
    try {
      const articles = await queryNewsApi(`"${opts.domain}"`, apiKey)
      const parsed   = parseArticles(articles)
      if (parsed.length >= 1) {
        console.log(`[NewsAPI] Strategy 3 hit (${parsed.length} articles) via domain: ${opts.domain}`)
        return parsed
      }
    } catch (err) { console.warn("[NewsAPI] Strategy 3 error:", err) }
  }

  // Strategy 4: bare exact name globally — last resort, may be noisy
  try {
    const q4       = `"${companyName}"`
    const articles = await queryNewsApi(q4, apiKey, { domains: SG_SEA_DOMAINS })
    const parsed   = parseArticles(articles)
    if (parsed.length >= 1) {
      console.log(`[NewsAPI] Strategy 4 hit (${parsed.length} articles): ${q4}`)
      return parsed
    }
  } catch (err) { console.warn("[NewsAPI] Strategy 4 error:", err) }

  console.warn(`[NewsAPI] All strategies exhausted for "${companyName}" — using mock data`)
  return getMockNews(companyName)
}

