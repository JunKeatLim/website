import type { CompanySummary } from "@/types"
import type { CompanyAnalysis } from "@/app/api/analyse/route"

// ─── Colour tokens ────────────────────────────────────────────────────────────
const NAVY   = [15,  23,  42 ] as const
const ORANGE = [255, 92,  53 ] as const
const GRAY   = [71,  85,  105] as const
const LIGHT  = [248, 250, 252] as const
const WHITE  = [255, 255, 255] as const
const MUTED  = [148, 163, 184] as const
const GREEN  = [21,  128, 61 ] as const
const RED    = [185, 28,  28 ] as const
const BLUE   = [29,  78,  216] as const
const LIGHT_BLUE = [239, 246, 255] as const
const LIGHT_RED  = [254, 242, 242] as const

// ─── Main export ──────────────────────────────────────────────────────────────
export async function exportCompanyPdf(data: CompanySummary): Promise<void> {
  // 1. Get AI analysis (+ web research) from server
  const res = await fetch("/api/analyse", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: string }).error ?? "Analysis failed"
    if (msg.includes("quota")) throw new Error("OpenAI quota exceeded — check your billing at platform.openai.com.")
    throw new Error(msg)
  }

  const analysis: CompanyAnalysis = await res.json()

  // 2. Build PDF client-side with jsPDF
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ format: "a4", unit: "mm", orientation: "portrait" })

  const W      = 210
  const MARGIN = 14
  const CW     = W - MARGIN * 2
  const PAGE_H = 297
  const FOOTER = 12
  let   y      = 0

  // ── Helpers ────────────────────────────────────────────────────────────────
  function fill(c: readonly [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]) }
  function ink(c: readonly [number, number, number])  { doc.setTextColor(c[0], c[1], c[2]) }
  function bold(size: number)   { doc.setFont("helvetica", "bold");   doc.setFontSize(size) }
  function normal(size: number) { doc.setFont("helvetica", "normal"); doc.setFontSize(size) }
  function italic(size: number) { doc.setFont("helvetica", "italic"); doc.setFontSize(size) }

  function hline(c: readonly [number, number, number]) {
    fill(c); doc.rect(MARGIN, y, CW, 0.3, "F")
  }

  function wrap(text: string, maxWidth: number, maxLines = 99): string[] {
    return doc.splitTextToSize(text, maxWidth).slice(0, maxLines)
  }

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_H - FOOTER) {
      doc.addPage()
      y = 14
      drawPageHeader()
      drawFooter()
    }
  }

  function drawPageHeader() {
    // Continuation pages: "FinSight · Market Intelligence Platform" in blue
    bold(7.5); doc.setTextColor(BLUE[0], BLUE[1], BLUE[2])
    doc.text("FinSight · Market Intelligence Platform", MARGIN, 9)
  }

  function drawFooter() {
    const fy = PAGE_H - 5
    normal(6.5); ink(MUTED)
    doc.text("FinSight · Market Intelligence Platform", MARGIN, fy)
    doc.text("This document is confidential and for internal use only.", W / 2, fy, { align: "center" })
    doc.text(new Date().toISOString().slice(0, 10), W - MARGIN, fy, { align: "right" })
  }

  const LINE_H  = 4.5
  const ROW_PAD = 3

  function rowHeight(text: string, textW: number): number {
    normal(8)
    const lines = wrap(text, textW, 4)
    return lines.length * LINE_H + ROW_PAD * 2
  }

  // ── Page 1 Header ──────────────────────────────────────────────────────────
  fill(NAVY); doc.rect(0, 0, W, 30, "F")
  bold(6.5); ink(MUTED)
  doc.text("FinSight · MARKET INTELLIGENCE PLATFORM", MARGIN, 9)
  bold(18); ink(WHITE)
  doc.text(data.companyName, MARGIN, 20)
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  normal(7.5); ink(MUTED)
  doc.text(today, W - MARGIN, 14, { align: "right" })
  bold(6.5)
  doc.text("CONFIDENTIAL", W - MARGIN, 21, { align: "right" })
  y = 36

  // ── Business Overview ──────────────────────────────────────────────────────
  const ov = data.overview.value
  if (ov?.description) {
    normal(8.5)
    const lines = wrap(ov.description, CW - 10, 5)
    const bh    = 7 + lines.length * 5
    fill(LIGHT);  doc.rect(MARGIN, y, CW, bh, "F")
    fill(ORANGE); doc.rect(MARGIN, y, 2,  bh, "F")
    bold(6.5); ink(ORANGE)
    doc.text("BUSINESS OVERVIEW", MARGIN + 5, y + 5)
    normal(8.5); ink(GRAY)
    doc.text(lines, MARGIN + 5, y + 10)
    y += bh + 4
  }

  // ── Performance Summary ────────────────────────────────────────────────────
  {
    normal(8.5)
    const lines = wrap(analysis.summary, CW - 10, 6)
    const bh    = 7 + lines.length * 5
    fill([255, 247, 237]); doc.rect(MARGIN, y, CW, bh, "F")
    fill(ORANGE);           doc.rect(MARGIN, y, 2,  bh, "F")
    bold(6.5); ink(ORANGE)
    doc.text("PERFORMANCE SUMMARY", MARGIN + 5, y + 5)
    normal(8.5); ink(GRAY)
    doc.text(lines, MARGIN + 5, y + 10)
    y += bh + 6
  }

  // ── Analyst Assessment (two columns) ──────────────────────────────────────
  ensureSpace(50)
  bold(7.5); ink(NAVY)
  doc.text("ANALYST ASSESSMENT", MARGIN, y)
  hline(NAVY); y += 5

  const halfW = (CW - 3) / 2

  const strengthsH  = analysis.strengths.map(s  => rowHeight(s, halfW - 14))
  const weaknessesH = analysis.weaknesses.map(w => rowHeight(w, halfW - 14))
  const swH = 9 + Math.max(
    strengthsH.reduce((a, b) => a + b, 0),
    weaknessesH.reduce((a, b) => a + b, 0),
  )

  // Strengths (green)
  fill([240, 253, 244]); doc.rect(MARGIN, y, halfW, swH, "F")
  bold(6.5); doc.setTextColor(GREEN[0], GREEN[1], GREEN[2])
  doc.text("COMPETITIVE STRENGTHS", MARGIN + 4, y + 5)
  let sy = y + 9
  analysis.strengths.forEach((s, i) => {
    const rh   = strengthsH[i]
    const midY = sy + rh / 2
    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2])
    doc.roundedRect(MARGIN + 4, midY - 2.5, 5, 5, 1, 1, "F")
    ink(WHITE); bold(6.5)
    doc.text(String(i + 1), MARGIN + 6.3, midY + 1.3)
    doc.setTextColor(22, 101, 52); normal(8)
    const sl = wrap(s, halfW - 14, 4)
    doc.text(sl, MARGIN + 11, midY - (sl.length - 1) * LINE_H / 2 + 1)
    sy += rh
  })

  // Weaknesses (red)
  const rx = MARGIN + halfW + 3
  fill(LIGHT_RED); doc.rect(rx, y, halfW, swH, "F")
  bold(6.5); doc.setTextColor(RED[0], RED[1], RED[2])
  doc.text("RISKS & WEAKNESSES", rx + 4, y + 5)
  let wy = y + 9
  analysis.weaknesses.forEach((w, i) => {
    const rh   = weaknessesH[i]
    const midY = wy + rh / 2
    doc.setFillColor(RED[0], RED[1], RED[2])
    doc.roundedRect(rx + 4, midY - 2.5, 5, 5, 1, 1, "F")
    ink(WHITE); bold(6.5)
    doc.text(String(i + 1), rx + 6.3, midY + 1.3)
    doc.setTextColor(153, 27, 27); normal(8)
    const wl = wrap(w, halfW - 14, 4)
    doc.text(wl, rx + 11, midY - (wl.length - 1) * LINE_H / 2 + 1)
    wy += rh
  })

  y += swH + 7

  // ── Recent News & Singapore / MAS Impact ──────────────────────────────────
  const newsItems = analysis.recentNews ?? []
  if (newsItems.length > 0) {
    ensureSpace(20)
    bold(7.5); ink(NAVY)
    doc.text("RECENT NEWS", MARGIN, y)
    hline(NAVY); y += 5

    for (const item of newsItems) {
      // Combine summary + MAS relevance into one flowing body (approved style)
      const body      = `${item.summary} MAS relevance: ${item.singaporeImpact}`
      const dateSource = [item.date, item.source ? `Source: ${item.source}` : ""].filter(Boolean).join(" | ")

      normal(8)
      const bodyLines = wrap(body, CW - 12, 8)
      // height: date-source row + gap + body + padding
      const bh = 5 + 3 + bodyLines.length * 4.8 + 4

      ensureSpace(bh + 3)

      fill(LIGHT_BLUE); doc.rect(MARGIN, y, CW, bh, "F")
      fill(BLUE);       doc.rect(MARGIN, y, 2,  bh, "F")

      // Date · Source header (top of card, small muted italic)
      italic(6); doc.setTextColor(100, 116, 139)
      doc.text(dateSource, MARGIN + 5, y + 4.5)

      // Body paragraph
      normal(8); ink(GRAY)
      doc.text(bodyLines, MARGIN + 5, y + 4.5 + 3 + 4)

      y += bh + 3
    }
    y += 2
  }

  // ── Discussion Talking Points ──────────────────────────────────────────────
  // Pre-calculate heights to keep the full block on one page
  const tp = analysis.talkingPoints

  // Approved style: Opening/Business/Financials = blue; Risks = red
  const tpSections = [
    { label: "OPENING THE CONVERSATION",   points: tp.opening,    color: BLUE as readonly [number,number,number], bg: LIGHT_BLUE },
    { label: "BUSINESS & MARKET POSITION", points: tp.business,   color: BLUE as readonly [number,number,number], bg: LIGHT_BLUE },
    { label: "FINANCIALS & KEY INVESTORS", points: tp.financials,  color: BLUE as readonly [number,number,number], bg: LIGHT_BLUE },
    { label: "RISKS TO FLAG",              points: tp.risks,       color: RED  as readonly [number,number,number], bg: LIGHT_RED  },
  ]

  normal(9)
  const ol = wrap(analysis.outlook, CW - 12, 6)
  const oh = 10 + ol.length * 5.5

  const tpHeights = tpSections.map(sec => {
    const ph = sec.points.map(pt => rowHeight(pt, CW - 18))
    return 8 + ph.reduce((a, b) => a + b, 0)
  })
  const totalTpH  = tpHeights.reduce((a, b) => a + b + 3, 0)
  const tpBlockH  = 8 + totalTpH + 5 + oh

  ensureSpace(tpBlockH)
  bold(7.5); ink(NAVY)
  doc.text("DISCUSSION TALKING POINTS", MARGIN, y)
  hline(NAVY); y += 5

  tpSections.forEach((section) => {
    const pointHeights = section.points.map(pt => rowHeight(pt, CW - 18))
    const bh = 8 + pointHeights.reduce((a, b) => a + b, 0)

    fill(section.bg);    doc.rect(MARGIN, y, CW, bh, "F")
    fill(section.color); doc.rect(MARGIN, y, 2,  bh, "F")

    // Section header: navy for blue sections, red for risks
    bold(6.5)
    if (section.color === RED) {
      doc.setTextColor(RED[0], RED[1], RED[2])
    } else {
      ink(NAVY)
    }
    doc.text(section.label, MARGIN + 5, y + 5)

    let py = y + 8
    section.points.forEach((pt, i) => {
      const rh   = pointHeights[i]
      const midY = py + rh / 2
      doc.setFillColor(section.color[0], section.color[1], section.color[2])
      doc.roundedRect(MARGIN + 5, midY - 2.5, 5, 5, 1, 1, "F")
      ink(WHITE); bold(6)
      doc.text(String(i + 1), MARGIN + 7.2, midY + 1.3)
      doc.setTextColor(30, 41, 59); normal(8)
      const pl = wrap(pt, CW - 18, 4)
      doc.text(pl, MARGIN + 13, midY - (pl.length - 1) * LINE_H / 2 + 1)
      py += rh
    })

    y += bh + 3
  })

  // ── 12–18 Month Outlook ────────────────────────────────────────────────────
  y += 3
  fill(NAVY); doc.rect(MARGIN, y, CW, oh, "F")
  bold(6.5); ink(MUTED)
  doc.text("12–18 MONTH OUTLOOK", MARGIN + 5, y + 6)
  normal(9); ink(WHITE)
  doc.text(ol, MARGIN + 5, y + 12)
  y += oh + 5

  // ── Footer (page 1) ────────────────────────────────────────────────────────
  drawFooter()

  // 3. Trigger browser download
  const date = new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })
    .replace(/\//g, "")
  doc.save(`${date} ${data.companyName} Summary.pdf`)
}
