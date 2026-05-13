import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { CompanySummary } from "@/types"

export interface TalkingPoints {
  opening:    string[]
  business:   string[]
  financials: string[]
  risks:      string[]
}

export interface RecentNewsItem {
  headline:        string
  summary:         string
  singaporeImpact: string
  sentiment:       "positive" | "neutral" | "negative"
  date:            string   // e.g. "1 Apr 2026"
  source:          string   // e.g. "Fintech News Malaysia"
}

export interface Reference {
  id:         number
  title:      string
  url:        string
  sourceName: string
}

export interface CompanyAnalysis {
  summary:       string
  strengths:     string[]
  weaknesses:    string[]
  outlook:       string
  talkingPoints: TalkingPoints
  recentNews:    RecentNewsItem[]
  references:    Reference[]
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "OpenAI key not configured" }, { status: 500 })

  const data: CompanySummary = await req.json()
  const ov        = data.overview.value
  const deals     = data.deals.value ?? []
  const investors = data.investors.value ?? []
  const news      = data.news.value ?? []

  const openai = new OpenAI({ apiKey })
  let researchText = ""
  const references: Reference[] = []

  // ── Step 1: Web search for live news & Singapore/MAS context ──────────────
  try {
    const researchPrompt =
      `Search for recent news (last 6 months) about "${data.companyName}"` +
      (ov?.industry ? ` (${ov.industry} company)` : "") +
      `. Find:
1. Latest company developments, partnerships, product launches, or milestones with exact dates
2. Any interactions with MAS (Monetary Authority of Singapore), Singapore government, or regulatory bodies
3. Singapore/SEA market activities, local economic impact, or expansion plans
4. Any funding rounds, acquisitions, or strategic moves
5. Any compliance issues, risks, or concerns raised by regulators
Include specific dates, publication names, and figures.`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const researchResponse = await (openai as any).responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: researchPrompt,
    })

    let refId = 1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const output of (researchResponse.output ?? []) as any[]) {
      if (output.type === "message") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const content of (output.content ?? []) as any[]) {
          if (content.type === "output_text") {
            researchText = content.text ?? ""
            for (const ann of content.annotations ?? []) {
              if (ann.type === "url_citation") {
                if (!references.find(r => r.url === ann.url)) {
                  let sourceName = ann.url as string
                  try { sourceName = new URL(ann.url).hostname.replace("www.", "") } catch { /* ignore */ }
                  references.push({ id: refId++, title: ann.title ?? ann.url, url: ann.url, sourceName })
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[WebSearch] Failed, continuing without live research:", String(err))
  }

  // ── Step 2: Structured analysis with gpt-4o ───────────────────────────────
  const prompt = `
You are a senior policy officer preparing a company brief for a high-level government meeting involving Singapore and other countries. Your reader has limited time. Write with precision and restraint — state facts where evidence supports them, and hedge where data is incomplete or unverified. Do not overstate or editorialise.

Tone guidelines:
- Be concise and direct. Avoid superlatives and promotional language.
- Hedge appropriately: use "reportedly", "according to company disclosures", "as reported by [source]", or "based on available information" where claims cannot be independently verified.
- Expand all acronyms on first use. Example: "MAS (Monetary Authority of Singapore)", "MOU (Memorandum of Understanding)".
- Do not frame gaps in data as failures or concerns unless evidence supports that framing.
- Refer to the company by name, not as "they" — keep it formal.

COMPANY: ${data.companyName}
DESCRIPTION: ${ov?.description ?? "N/A"}
INDUSTRY: ${ov?.industry ?? "N/A"}
STAGE: ${ov?.stage ?? "N/A"}
FOUNDED: ${ov?.founded ?? "N/A"}
EMPLOYEES: ${ov?.employees ?? "N/A"}
VALUATION: ${ov?.valuation ?? "N/A"}
TOTAL RAISED: ${ov?.totalRaised ?? "N/A"}
FUNDING ROUNDS: ${deals.map(d => `${d.round} (${d.amount}, ${d.date})`).join("; ") || "N/A"}
KEY INVESTORS: ${investors.map(i => `${i.name} (${i.type})`).join(", ") || "N/A"}
EXISTING NEWS: ${news.map(n => n.title).join(" | ") || "N/A"}
HQ: ${data.location.value?.city ?? "Singapore"}, ${data.location.value?.country ?? "Singapore"}
${researchText ? `\nWEB RESEARCH (live information retrieved at time of generation):\n${researchText}` : ""}

Return ONLY valid JSON with no markdown, in exactly this shape:
{
  "summary": "2-3 sentences. State the company's business, current stage, and any recent significant development. Hedge figures that are unverified. Expand acronyms on first use.",
  "strengths": [
    "One sentence grounded in evidence. State the strength plainly without exaggeration.",
    "One sentence.",
    "One sentence."
  ],
  "weaknesses": [
    "One sentence. Frame as an area warranting attention, not a condemnation.",
    "One sentence.",
    "One sentence."
  ],
  "outlook": "One sentence. Describe the likely trajectory over the next 12-18 months, hedged where appropriate. Do not predict with false certainty.",
  "talkingPoints": {
    "opening": [
      "One sentence: who the company is, what it does, and why it is relevant to Singapore or the region — cite a specific figure or milestone if available.",
      "One sentence: most significant funding event or valuation marker and what it indicates.",
      "One sentence: how the company relates to national priorities or the regional competitive landscape."
    ],
    "business": [
      "One sentence: core revenue model and primary customer segment. Be specific.",
      "One sentence: clearest competitive advantage, with supporting evidence.",
      "One sentence: a concrete, verifiable growth indicator."
    ],
    "financials": [
      "One sentence: total capital raised and latest round. Note if figures are unverified.",
      "One sentence: most strategically significant investor(s) and what their involvement indicates.",
      "One sentence: valuation relative to stage and sector, with appropriate hedging."
    ],
    "risks": [
      "One sentence: most material business or market risk, stated plainly.",
      "One sentence: regulatory, geopolitical, or compliance risk relevant to Singapore or the region.",
      "One sentence: structural or macro headwind that may affect the company's trajectory."
    ]
  },
  "recentNews": [
    {
      "headline": "Factual headline, max 12 words, no editorial spin",
      "summary": "1-2 sentences. State what happened, when, and the key figures involved. Use the exact date if known.",
      "singaporeImpact": "One sentence. State the specific relevance to Singapore, MAS (Monetary Authority of Singapore), or SEA investors. If relevance is indirect, say so.",
      "sentiment": "positive or neutral or negative",
      "date": "Exact date if known (e.g. '1 Apr 2026'), or best approximation (e.g. 'April 2026')",
      "source": "Publication name (e.g. 'Fintech News Malaysia', 'The Business Times')"
    }
  ]
}

Rules:
- recentNews: include 1-2 items drawn from web research. Use existing news if no web data is available. Only include items you can attribute to a specific source and date.
- Each talking point: one complete sentence, under 30 words, no filler phrases.
- Expand all acronyms on first use throughout the document.
- Flag data gaps plainly (e.g. "Valuation has not been publicly disclosed.") rather than fabricating or speculating.
- If web research confirms or corrects existing data, reflect that in the relevant field.
`.trim()

  try {
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o",
      messages:        [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature:     0.2,
    })

    const text   = completion.choices[0].message.content ?? "{}"
    const parsed = JSON.parse(text)

    const analysis: CompanyAnalysis = { ...parsed, references }
    return NextResponse.json(analysis)
  } catch (err) {
    const msg = String(err)
    console.error("[OpenAI] error:", msg)
    if (msg.includes("429")) {
      return NextResponse.json(
        { error: "OpenAI quota exceeded — check your billing at platform.openai.com" },
        { status: 429 },
      )
    }
    return NextResponse.json({ error: "Analysis failed: " + msg }, { status: 500 })
  }
}
