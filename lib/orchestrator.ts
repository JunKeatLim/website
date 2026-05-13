import pLimit from "p-limit"
import { prisma } from "./prisma"
import { getFromCache, setInCache, cacheKey, TTL } from "./redis"
import { buildMeta, evaluateMeta } from "./metadata"
import {
  searchCompany,
  fetchCompanyOverview,
  fetchInvestors,
  fetchDeals,
} from "./pitchbook"
import { fetchNews, clearbitSearch } from "./sources"
import type { CompanySummary, Field } from "@/types"

// Limit concurrent outbound API calls (be kind to PitchBook rate limits)
const limit = pLimit(3)

// ─── Main entry point ─────────────────────────────────────────────────────────
// domainHint: provided when the user selects a specific suggestion from the
// autocomplete dropdown. It bypasses the Clearbit re-lookup and forces an
// exact domain match in both the DB cache and the API fetch, preventing
// name-collision issues (e.g. "Pand.AI" vs "Pandaily").
export async function lookupCompany(
  query: string,
  domainHint?: string,
): Promise<CompanySummary | null> {
  const key = cacheKey.company(domainHint ?? query)

  // 1. Check Redis hot cache first (fastest)
  const hot = await getFromCache<CompanySummary>(key)
  if (hot) {
    console.log(`[Cache] HIT (Redis): ${query}`)
    return hot
  }

  // 2. Check PostgreSQL persistent cache — prefer exact domain match when hint provided
  let dbRecord = null
  try {
    if (domainHint) {
      dbRecord = await prisma.companyCache.findFirst({
        where: { domain: { equals: domainHint, mode: "insensitive" } },
      })
    }
    if (!dbRecord) {
      dbRecord = await prisma.companyCache.findFirst({
        where: {
          OR: [
            { companyName: { contains: query, mode: "insensitive" } },
            { domain: { contains: query, mode: "insensitive" } },
          ],
        },
      })
    }
  } catch (err) {
    console.warn("[Cache] Postgres unavailable — skipping DB cache:", (err as Error).message)
  }

  if (dbRecord) {
    console.log(`[Cache] HIT (Postgres): ${query}`)

    try {
      await prisma.companyCache.update({
        where: { id: dbRecord.id },
        data: { lastSearchedAt: new Date(), searchCount: { increment: 1 } },
      })
    } catch { /* non-critical */ }

    const evaluated = evaluateSummary(dbRecordToSummary(dbRecord))
    await setInCache(key, evaluated, TTL.HOT_CACHE)
    return evaluated
  }

  // 3. Cache miss — fetch from APIs
  console.log(`[Cache] MISS: ${query} — fetching from APIs`)
  const summary = await fetchFromApis(query, domainHint)

  if (!summary) return null

  // 4. Persist to PostgreSQL
  await persistToDb(summary)

  // 5. Warm Redis
  await setInCache(key, summary, TTL.HOT_CACHE)

  return summary
}

// ─── Fetch all fields from APIs in parallel ───────────────────────────────────
async function fetchFromApis(query: string, domainHint?: string): Promise<CompanySummary | null> {
  const now = new Date().toISOString()

  // Step 1: Resolve canonical name + domain via Clearbit (unless caller supplied both)
  let companyName = query
  let domain      = domainHint

  if (!domainHint) {
    const clearbit = await clearbitSearch(query)
    companyName = clearbit?.name ?? query
    domain      = clearbit?.domain ?? undefined
    console.log(`[Clearbit] ${query} → ${companyName} (${domain ?? "no domain"})`)
  } else {
    console.log(`[Clearbit] Skipped — domain hint provided: ${domainHint}`)
  }

  // Step 2: Try to find PitchBook ID using the resolved name
  const pbMatch = process.env.PITCHBOOK_API_KEY
    ? await searchCompany(companyName)
    : null

  // Step 3: If no domain resolved and no PitchBook key, use dev mock
  if (!domain && !domainHint && !process.env.PITCHBOOK_API_KEY) {
    return buildMockSummary(query)
  }

  // Step 4: If we have a PitchBook ID, fetch full data in parallel
  let overviewData = null, investorsData = null, dealsData = null
  if (pbMatch) {
    const pitchbookId = pbMatch.id
    const [overviewResult, investorsResult, dealsResult] = await Promise.allSettled([
      limit(() => fetchCompanyOverview(pitchbookId)),
      limit(() => fetchInvestors(pitchbookId)),
      limit(() => fetchDeals(pitchbookId)),
    ])
    overviewData  = overviewResult.status  === "fulfilled" ? overviewResult.value  : null
    investorsData = investorsResult.status === "fulfilled" ? investorsResult.value : null
    dealsData     = dealsResult.status     === "fulfilled" ? dealsResult.value     : null
  } else {
    console.warn(`[PitchBook] No ID found for: ${companyName} — showing available data`)
  }

  // Step 5: Fetch news using canonical company name + domain + industry for accuracy
  const [newsData] = await Promise.allSettled([
    fetchNews(companyName, {
      domain:   domain,
      industry: overviewData?.overview?.industry,
    }),
  ])
  const news = newsData.status === "fulfilled" ? newsData.value : []

  const contact = overviewData?.contact ?? null

  const summary: CompanySummary = {
    id:           pbMatch?.id ?? `cb-${domain ?? query.toLowerCase().replace(/\s+/g, "-")}`,
    pitchbookId:  pbMatch?.id,
    companyName,
    domain,

    overview: {
      value: overviewData?.overview ?? null,
      meta:  buildMeta("overview", "PitchBook", "paid", 0.95, !overviewData),
    },

    investors: {
      value: investorsData ?? [],
      meta:  buildMeta("investors", "PitchBook", "paid", 0.95, !investorsData),
    },

    deals: {
      value: dealsData ?? [],
      meta:  buildMeta("deals", "PitchBook", "paid", 0.92, !dealsData),
    },

    news: {
      value: news,
      meta:  buildMeta(
        "news",
        process.env.NEWSAPI_KEY ? "NewsAPI" : "Mock",
        process.env.NEWSAPI_KEY ? "free"    : "fallback",
        0.85,
        !process.env.NEWSAPI_KEY,
      ),
    },

    contact: {
      value: contact,
      meta:  buildMeta("contact", "PitchBook", "paid", 0.95, !contact),
    },

    location: {
      value: overviewData?.location ?? null,
      meta:  buildMeta("location", "PitchBook", "paid", 0.90, !overviewData),
    },

    lastSearchedAt: now,
    searchCount: 1,
  }

  return summary
}

// ─── Persist summary to PostgreSQL ───────────────────────────────────────────
async function persistToDb(summary: CompanySummary): Promise<void> {
  const ttlDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30d default

  try {
    await prisma.companyCache.upsert({
      where: { pitchbookId: summary.pitchbookId ?? summary.id },
      create: {
        pitchbookId: summary.pitchbookId,
        companyName: summary.companyName,
        domain: summary.domain,
        rawPayload: summary as object,
        overview: summary.overview as object,
        investors: summary.investors as object,
        deals: summary.deals as object,
        news: summary.news as object,
        contact: summary.contact as object,
        location: summary.location as object,
        ttlExpiresAt: ttlDate,
      },
      update: {
        rawPayload: summary as object,
        overview: summary.overview as object,
        investors: summary.investors as object,
        deals: summary.deals as object,
        news: summary.news as object,
        contact: summary.contact as object,
        location: summary.location as object,
        ttlExpiresAt: ttlDate,
        updatedAt: new Date(),
      },
    })
  } catch (err) {
    console.error("[DB] persistToDb error:", err)
  }
}

// ─── Convert DB record back to CompanySummary ─────────────────────────────────
function dbRecordToSummary(record: {
  id: string
  pitchbookId?: string | null
  companyName: string
  domain?: string | null
  rawPayload?: unknown
  overview?: unknown
  investors?: unknown
  deals?: unknown
  news?: unknown
  contact?: unknown
  location?: unknown
  lastSearchedAt: Date
  searchCount: number
}): CompanySummary {
  const raw = record.rawPayload as CompanySummary | null
  if (raw) return raw

  // Fallback: reconstruct from individual fields
  return {
    id: record.id,
    pitchbookId: record.pitchbookId ?? undefined,
    companyName: record.companyName,
    domain: record.domain ?? undefined,
    overview:  (record.overview  as Field<CompanySummary["overview"]["value"]>)  ?? emptyField("overview"),
    investors: (record.investors as Field<CompanySummary["investors"]["value"]>) ?? emptyField("investors"),
    deals:     (record.deals     as Field<CompanySummary["deals"]["value"]>)     ?? emptyField("deals"),
    news:      (record.news      as Field<CompanySummary["news"]["value"]>)      ?? emptyField("news"),
    contact:   (record.contact   as Field<CompanySummary["contact"]["value"]>)   ?? emptyField("contact"),
    location:  (record.location  as Field<CompanySummary["location"]["value"]>)  ?? emptyField("location"),
    lastSearchedAt: record.lastSearchedAt.toISOString(),
    searchCount: record.searchCount,
  }
}

// Re-evaluate freshness on all fields
function evaluateSummary(summary: CompanySummary): CompanySummary {
  return {
    ...summary,
    overview:  { ...summary.overview,  meta: evaluateMeta(summary.overview.meta,  "overview")  },
    investors: { ...summary.investors, meta: evaluateMeta(summary.investors.meta, "investors") },
    deals:     { ...summary.deals,     meta: evaluateMeta(summary.deals.meta,     "deals")     },
    news:      { ...summary.news,      meta: evaluateMeta(summary.news.meta,      "news")      },
    contact:   { ...summary.contact,   meta: evaluateMeta(summary.contact.meta,   "contact")   },
    location:  { ...summary.location,  meta: evaluateMeta(summary.location.meta,  "location")  },
  }
}

// Empty field helper for missing data
function emptyField<T>(fieldKey: string): Field<T> {
  return {
    value: null,
    meta: buildMeta(fieldKey, "None", "fallback", 0, true),
  }
}

// ─── Mock summary for development (no API keys) ──────────────────────────────
function buildMockSummary(query: string): CompanySummary {
  const now = new Date().toISOString()
  return {
    id: `mock-${query.toLowerCase().replace(/\s+/g, "-")}`,
    companyName: query,
    domain: `${query.toLowerCase().replace(/\s+/g, "")}.com`,
    overview: {
      value: {
        description: `${query} is a company. Add your PitchBook API key to fetch real data.`,
        industry: "Technology",
        tags: ["Mock Data"],
      },
      meta: buildMeta("overview", "Mock", "fallback", 0.5, true),
    },
    investors: { value: [], meta: buildMeta("investors", "Mock", "fallback", 0.5, true) },
    deals:     { value: [], meta: buildMeta("deals",     "Mock", "fallback", 0.5, true) },
    news:      { value: [], meta: buildMeta("news",      "Mock", "fallback", 0.5, true) },
    contact:   { value: null, meta: buildMeta("contact", "Mock", "fallback", 0.5, true) },
    location:  { value: null, meta: buildMeta("location","Mock", "fallback", 0.5, true) },
    lastSearchedAt: now,
    searchCount: 1,
  }
}
