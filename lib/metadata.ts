import type { FieldMeta, FreshnessStatus, SourceTier } from "@/types"
import { TTL_DAYS } from "./constants"

function computeStatus(ageDays: number, fieldKey: string): FreshnessStatus {
  const t = TTL_DAYS[fieldKey] ?? { fresh: 30, stale: 60 }
  if (ageDays <= t.fresh) return "fresh"
  if (ageDays <= t.stale) return "stale"
  return "expired"
}

function computeConfidence(ageDays: number, fieldKey: string, base = 0.95): number {
  const t = TTL_DAYS[fieldKey] ?? { fresh: 30, stale: 60 }
  if (ageDays <= t.fresh) return base
  if (ageDays <= t.stale) return Math.max(0.5, base - ((ageDays - t.fresh) / (t.stale - t.fresh)) * 0.45)
  return Math.max(0.3, 0.5 - (Math.min(1, (ageDays - t.stale) / t.stale)) * 0.2)
}

export function buildMeta(
  fieldKey: string,
  sourceName: string,
  sourceTier: SourceTier,
  baseConfidence = 0.95,
  isFallback = false,
): FieldMeta {
  const now       = new Date()
  const ttlDays   = TTL_DAYS[fieldKey]?.fresh ?? 30
  const expiresAt = new Date(now.getTime() + ttlDays * 86_400_000)
  return {
    sourceName,
    sourceTier,
    fetchedAt:      now.toISOString(),
    ttlExpiresAt:   expiresAt.toISOString(),
    ageDays:        0,
    status:         "fresh",
    confidenceScore: baseConfidence,
    isFallback,
    needsReview:    false,
  }
}

export function evaluateMeta(meta: FieldMeta, fieldKey: string): FieldMeta {
  const ageDays = Math.floor((Date.now() - new Date(meta.fetchedAt).getTime()) / 86_400_000)
  return {
    ...meta,
    ageDays,
    status:          computeStatus(ageDays, fieldKey),
    confidenceScore: Math.round(computeConfidence(ageDays, fieldKey, meta.confidenceScore) * 100) / 100,
    needsReview:     computeStatus(ageDays, fieldKey) === "expired",
  }
}

export function needsRefresh(meta: FieldMeta): boolean {
  return meta.status === "stale" || meta.status === "expired"
}

export function getTtlSeconds(fieldKey: string): number {
  const map: Record<string, number> = {
    overview:  30 * 86400,
    investors: 14 * 86400,
    deals:     7  * 86400,
    news:      1  * 86400,
    contact:   30 * 86400,
    location:  180* 86400,
  }
  return map[fieldKey] ?? 30 * 86400
}
