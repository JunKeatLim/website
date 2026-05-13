import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { lookupCompany } from "@/lib/orchestrator"
import type { ApiResponse, CompanySummary } from "@/types"

const QuerySchema = z.object({
  q: z.string().min(1).max(200).trim(),
})

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<CompanySummary>>> {
  const { searchParams } = new URL(req.url)

  // Validate query param
  const parsed = QuerySchema.safeParse({ q: searchParams.get("q") })
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: "Query parameter 'q' is required", fromCache: false },
      { status: 400 }
    )
  }

  const { q } = parsed.data
  const domain = searchParams.get("domain")?.trim() || undefined

  try {
    const company = await lookupCompany(q, domain)

    if (!company) {
      return NextResponse.json(
        { data: null, error: `No company found for: ${q}`, fromCache: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: company,
      fromCache: true,
      cachedAt: company.lastSearchedAt,
    })
  } catch (err) {
    console.error("[API /company/search] error:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error", fromCache: false },
      { status: 500 }
    )
  }
}
