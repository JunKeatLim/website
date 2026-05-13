import { NextRequest, NextResponse } from "next/server"

export interface SuggestionItem {
  name:   string
  domain: string
  logo:   string | null
}

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim()
  if (!q || q.length < 1) return NextResponse.json([])

  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`,
      // Short cache — suggestions should feel live
      { next: { revalidate: 30 } },
    )
    if (!res.ok) return NextResponse.json([])

    const raw: Array<{ name: string; domain: string; logo: string | null }> = await res.json()
    const suggestions: SuggestionItem[] = (raw ?? []).slice(0, 6).map(r => ({
      name:   r.name,
      domain: r.domain,
      logo:   r.logo ?? null,
    }))
    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json([])
  }
}
