// ─── Data freshness status ───────────────────────────────────────────────────
export type FreshnessStatus = "fresh" | "stale" | "expired" | "missing"
export type SourceTier = "paid" | "free" | "fallback"

// ─── Metadata envelope — attached to every field ────────────────────────────
export interface FieldMeta {
  sourceName: string           // e.g. "PitchBook", "NewsAPI"
  sourceTier: SourceTier
  fetchedAt: string            // ISO 8601
  ttlExpiresAt: string         // ISO 8601
  ageDays: number              // computed on read
  status: FreshnessStatus
  confidenceScore: number      // 0.0 – 1.0, degrades with age
  isFallback: boolean
  needsReview?: boolean
}

// ─── Field wrapper — value + metadata ───────────────────────────────────────
export interface Field<T> {
  value: T | null
  meta: FieldMeta
}

// ─── Company summary ────────────────────────────────────────────────────────
export interface CompanySummary {
  id: string
  pitchbookId?: string
  companyName: string
  domain?: string
  overview: Field<CompanyOverview | null>
  investors: Field<Investor[] | null>
  deals: Field<Deal[] | null>
  news: Field<NewsArticle[] | null>
  contact: Field<Contact | null>
  location: Field<Location | null>
  lastSearchedAt: string
  searchCount: number
}

export interface CompanyOverview {
  description: string
  industry: string
  sector?: string
  stage?: string
  founded?: number
  employees?: string
  valuation?: string
  totalRaised?: string
  website?: string
  logoUrl?: string
  tags: string[]
}

export interface Investor {
  name: string
  type: string                 // "VC", "CVC", "HF", "PE", "Angel"
  rounds: string[]             // ["Seed", "Series A"]
  isLead: boolean
  confidenceScore: number
}

export interface Deal {
  round: string
  amount: string
  amountUsd?: number
  date: string
  postMoneyValuation?: string
  leadInvestors: string[]
  stage: string
}

export interface NewsArticle {
  title: string
  source: string
  publishedAt: string
  url?: string
  sentiment: "positive" | "neutral" | "negative"
  summary?: string
}

export interface Contact {
  name: string
  title: string
  email?: string
  linkedin?: string
  twitter?: string
  sourceUrl?: string
}

export interface Location {
  address?: string
  city?: string
  country?: string
  region?: string
  postalCode?: string
  lat?: number
  lng?: number
}

// ─── Market data ─────────────────────────────────────────────────────────────
export interface MarketDeal {
  company: string
  type: string
  sector: string
  amount: string
  amountSgd: number
  date: string
  isNew: boolean
}

export interface MarketNews {
  title: string
  source: string
  publishedAt: string
  sentiment: "positive" | "neutral" | "negative"
  url?: string
}

export interface SectorPerformance {
  sector: string
  change: number
  dealCount: number
  color: string
}

// ─── API response wrapper ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error?: string
  fromCache: boolean
  cachedAt?: string
}

// ─── Cache check result ──────────────────────────────────────────────────────
export interface CacheResult {
  hit: boolean
  fresh: boolean
  data?: CompanySummary
}
