import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFromCache, cacheKey } from "@/lib/redis"
import { lookupCompany } from "@/lib/orchestrator"
import type { ApiResponse, CompanySummary } from "@/types"

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<CompanySummary>>> {
  const { companyName } = await req.json()
  if (!companyName?.trim()) {
    return NextResponse.json({ data: null, error: "companyName required", fromCache: false }, { status: 400 })
  }

  // 1. Bust Redis hot cache
  await deleteFromCache(cacheKey.company(companyName))

  // 2. Delete Postgres record to force a full re-fetch from APIs
  try {
    await prisma.companyCache.deleteMany({
      where: { companyName: { equals: companyName.trim(), mode: "insensitive" } },
    })
  } catch (err) {
    console.warn("[Refresh] Postgres delete failed (non-critical):", err)
  }

  // 3. Re-fetch fresh data — will now miss all caches and hit APIs
  const company = await lookupCompany(companyName.trim())
  if (!company) {
    return NextResponse.json({ data: null, error: "Company not found", fromCache: false }, { status: 404 })
  }

  return NextResponse.json({ data: company, fromCache: false, cachedAt: new Date().toISOString() })
}
