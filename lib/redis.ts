import Redis from "ioredis"
import { TTL } from "./constants"
export { TTL } from "./constants"

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.REDIS_URL
  if (!url) {
    if (process.env.NODE_ENV === "development")
      console.warn("[Redis] REDIS_URL not set — cache disabled")
    return null
  }
  redis = new Redis(url, {
    tls: url.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  })
  redis.on("error", (e) => console.error("[Redis] connection error:", e))
  return redis
}

export const cacheKey = {
  company: (id: string) => `company:${id.toLowerCase().replace(/\s+/g, "-")}`,
  market:  () => `market:sg:latest`,
  news:    (q: string) => `news:${q.toLowerCase().replace(/\s+/g, "-")}`,
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    const raw = await client.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch (e) {
    console.error("[Redis] GET", e)
    return null
  }
}

export async function setInCache<T>(key: string, value: T, ttlSeconds = TTL.HOT_CACHE): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch (e) {
    console.error("[Redis] SET", e)
  }
}

export async function deleteFromCache(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.del(key)
  } catch (e) {
    console.error("[Redis] DEL", e)
  }
}
