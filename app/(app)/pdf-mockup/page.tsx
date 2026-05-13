"use client"

// Temporary mockup page — remove after review
const ORANGE = "#ff5c35"
const GRAY   = "#6b7280"

export default function PdfMockup() {
  return (
    <div className="bg-gray-200 min-h-screen p-8 flex justify-center">
      {/* A4 page */}
      <div style={{
        width: 794, background: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif",
        fontSize: 13, color: "#111827", lineHeight: 1.5,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        minHeight: 1122, position: "relative", flexShrink: 0,
      }}>
        <div style={{ padding: "40px 44px" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(135deg,${ORANGE},#ff9a6c)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 22, fontWeight: 900,
              }}>N</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>Nium</div>
                <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                  {["FinTech","B2B Payments","Private","Est. 2014"].map(t => (
                    <span key={t} style={{
                      display: "inline-block",
                      background: t === "Private" ? "#f3f4f6" : "#fff7ed",
                      color: t === "Private" ? "#374151" : ORANGE,
                      fontSize: 10, fontWeight: 700,
                      padding: "2px 10px", borderRadius: 999,
                      border: t === "Private" ? "none" : `1px solid #fed7aa`,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: GRAY, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Company Brief</div>
              <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>8 April 2026</div>
              <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 1 }}>FinSight · Confidential</div>
            </div>
          </div>

          {/* ── Gradient rule ── */}
          <div style={{ height: 3, background: `linear-gradient(90deg,${ORANGE},#ff9a6c,transparent)`, borderRadius: 2, marginBottom: 24 }} />

          {/* ── Description ── */}
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "14px 16px", marginBottom: 20, borderLeft: `3px solid ${ORANGE}` }}>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
              Nium is a global financial infrastructure platform that enables banks, fintechs, and businesses to pay, collect, and manage funds globally. The company provides embedded finance solutions across 190+ countries.
            </div>
          </div>

          {/* ── Metric tiles ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Valuation",    value: "S$1.7B", sub: "Post-money"   },
              { label: "Total Raised", value: "S$739M", sub: "6 rounds"     },
              { label: "Employees",    value: "1 000",  sub: "Global headcount" },
              { label: "Last Deal",    value: "Apr 2024", sub: "Series F"   },
            ].map(m => (
              <div key={m.label} style={{ flex: 1, background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Two-col body ── */}
          <div style={{ display: "flex", gap: 20 }}>

            {/* Left */}
            <div style={{ flex: 1.1 }}>

              {/* Investors */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e5e7eb" }}>Key Investors</div>
                {[
                  { name: "Visa",            type: "Corporate VC",  rounds: ["Series D","Series F"], lead: true,  color: "#ff5c35" },
                  { name: "Temasek",         type: "Sovereign Fund", rounds: ["Series F"],           lead: false, color: "#f97316" },
                  { name: "Vertex Ventures", type: "Venture Capital",rounds: ["Series A","Series B"], lead: true, color: "#eab308" },
                  { name: "Global Founders", type: "Venture Capital",rounds: ["Seed","Series A"],    lead: false, color: "#22c55e" },
                ].map((inv, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${inv.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: inv.color, flexShrink: 0 }}>
                      {inv.name.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{inv.name}</div>
                      <div style={{ fontSize: 10, color: GRAY }}>{inv.type}{inv.lead ? " · Lead" : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {inv.rounds.map(r => (
                        <span key={r} style={{ fontSize: 9, fontWeight: 700, background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: 4 }}>{r}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Funding Timeline */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e5e7eb" }}>Funding Timeline</div>
                {[
                  { round: "Series F", amount: "S$200M", date: "Apr 2024", lead: "Visa"  },
                  { round: "Series E", amount: "S$120M", date: "Nov 2022", lead: "Temasek" },
                  { round: "Series D", amount: "S$187M", date: "Jul 2021", lead: "Temasek" },
                  { round: "Series C", amount: "S$40M",  date: "Jan 2020", lead: "Vertex" },
                ].map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? ORANGE : "#d1d5db", flexShrink: 0 }} />
                      {i < 3 && <div style={{ width: 1, height: 20, background: "#e5e7eb", marginTop: 3 }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? ORANGE : GRAY }}>{d.round}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{d.amount}</div>
                      <div style={{ fontSize: 10, color: GRAY }}>{d.date} · {d.lead}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div style={{ flex: 0.9 }}>

              {/* Company Details */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e5e7eb" }}>Company Details</div>
                {[
                  ["Website",  "nium.com"],
                  ["Industry", "FinTech"],
                  ["Sector",   "Financial Services"],
                  ["Stage",    "Series F"],
                  ["Founded",  "2014"],
                  ["HQ",       "Singapore, SG"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: 11, color: GRAY, fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 11, color: "#111827", fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Recent News */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e5e7eb" }}>Recent News</div>
                {[
                  { title: "Nium raises $50M to expand into Middle East and Africa markets", source: "TechInAsia", date: "2026-03-12", sentiment: "positive" },
                  { title: "Nium partners with Visa to accelerate cross-border payment rails", source: "Fintech News SG", date: "2026-02-28", sentiment: "positive" },
                  { title: "Southeast Asia fintech funding slows amid rate environment", source: "Bloomberg", date: "2026-02-10", sentiment: "neutral" },
                ].map((a, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: "10px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: GRAY }}>{a.source}</span>
                      <span style={{ fontSize: 10, color: "#d1d5db" }}>·</span>
                      <span style={{ fontSize: 10, color: GRAY }}>{a.date}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                        background: a.sentiment === "positive" ? "#f0fdf4" : "#f3f4f6",
                        color: a.sentiment === "positive" ? "#16a34a" : GRAY,
                      }}>{a.sentiment}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ── AI Analyst Brief ── */}
          <div style={{ marginTop: 28 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ height: 3, width: 20, background: ORANGE, borderRadius: 2 }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Analyst Brief</div>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <div style={{ fontSize: 9, color: "#d1d5db", fontStyle: "italic" }}>Generated by Gemini · For reference only</div>
            </div>

            {/* Performance summary */}
            <div style={{ background: "#fff7ed", borderRadius: 10, padding: "14px 16px", marginBottom: 14, border: `1px solid #fed7aa` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Performance Summary</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
                Nium has demonstrated strong momentum in the global payments infrastructure space, achieving unicorn status with a $1.3B valuation backed by marquee investors including Visa and Temasek. The company's Series F round signals continued institutional confidence, and its 190+ country reach positions it as a leading cross-border rails provider in Southeast Asia.
              </div>
            </div>

            {/* Strengths & Weaknesses side by side */}
            <div style={{ display: "flex", gap: 14 }}>

              {/* Strengths */}
              <div style={{ flex: 1, background: "#f0fdf4", borderRadius: 10, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  ✦ Strengths in SG Market
                </div>
                {[
                  "Singapore's status as a regional fintech hub provides strong regulatory support via MAS, giving Nium a first-mover advantage in licensed cross-border infrastructure.",
                  "Strategic backing from Temasek and Vertex Ventures signals deep local institutional trust, facilitating government-linked enterprise sales.",
                  "B2B payments demand in SEA is growing at 18% CAGR — Nium's embedded finance APIs are well-positioned to capture SME and bank digitisation spend.",
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", marginTop: 4, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.5 }}>{s}</div>
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div style={{ flex: 1, background: "#fef2f2", borderRadius: 10, padding: "14px 16px", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  ✦ Risks &amp; Weaknesses
                </div>
                {[
                  "Intensifying competition from Airwallex and Wise in the B2B cross-border corridor may compress margins and slow enterprise client acquisition.",
                  "Regulatory fragmentation across ASEAN markets increases compliance overhead, potentially delaying product expansion into Indonesia and Vietnam.",
                  "No disclosed path to profitability; high cash burn relative to revenue at current employee count raises questions ahead of a potential IPO or secondary.",
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", marginTop: 4, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: "#991b1b", lineHeight: 1.5 }}>{s}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Outlook */}
            <div style={{ marginTop: 14, background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 18 }}>🔭</div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>12–18 Month Outlook</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  Nium is likely to pursue an IPO on SGX or NYSE within 18 months, contingent on achieving EBITDA breakeven — watch for further enterprise deals in the Middle East and a potential acquisition in the cards issuance space.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: "absolute", bottom: 28, left: 44, right: 44,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 10, borderTop: "1px solid #e5e7eb",
        }}>
          <div style={{ fontSize: 9, color: "#d1d5db", fontWeight: 600 }}>FinSight · Market Intelligence Platform</div>
          <div style={{ fontSize: 9, color: "#d1d5db" }}>Confidential · For internal use only</div>
          <div style={{ fontSize: 9, color: "#d1d5db" }}>2026-04-08</div>
        </div>
      </div>
    </div>
  )
}
