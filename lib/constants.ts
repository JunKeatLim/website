// TTL values in seconds — shared between client and server
export const TTL = {
  OVERVIEW:  60 * 60 * 24 * 30,
  INVESTORS: 60 * 60 * 24 * 14,
  DEALS:     60 * 60 * 24 * 7,
  NEWS:      60 * 60 * 24 * 1,
  CONTACT:   60 * 60 * 24 * 30,
  LOCATION:  60 * 60 * 24 * 180,
  HOT_CACHE: 60 * 60,
} as const

// TTL thresholds in days per field
export const TTL_DAYS: Record<string, { fresh: number; stale: number }> = {
  overview:  { fresh: 30,  stale: 60  },
  investors: { fresh: 14,  stale: 30  },
  deals:     { fresh: 7,   stale: 21  },
  news:      { fresh: 1,   stale: 3   },
  contact:   { fresh: 30,  stale: 90  },
  location:  { fresh: 90,  stale: 180 },
}
