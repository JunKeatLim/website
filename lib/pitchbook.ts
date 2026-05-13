import axios from "axios"
import type { CompanyOverview, Investor, Deal, Contact, Location } from "@/types"

const BASE_URL = process.env.PITCHBOOK_BASE_URL ?? "https://api.pitchbook.com"
const API_KEY  = process.env.PITCHBOOK_API_KEY ?? ""

if (!API_KEY && process.env.NODE_ENV === "production") {
  throw new Error("PITCHBOOK_API_KEY is not set")
}

// PitchBook uses its own "PB-Token <key>" auth scheme — do NOT prepend "Bearer"
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
})

// ─── Search: GET /search?query={name} ────────────────────────────────────────
export async function searchCompany(query: string): Promise<{ id: string; name: string } | null> {
  if (!API_KEY) return null
  try {
    const { data } = await client.get("/search", { params: { query, perPage: 5 } })
    const items: Array<{ pbId: string; name: string; primaryFirmType?: { type: string } }> =
      data?.items ?? []
    // Prefer exact company match
    const company = items.find(i =>
      i.primaryFirmType?.type === "COMPANY" ||
      i.name.toLowerCase() === query.toLowerCase()
    ) ?? items[0]
    return company ? { id: company.pbId, name: company.name } : null
  } catch (err) {
    console.error("[PitchBook] searchCompany error:", err)
    return null
  }
}

// ─── Company Bio: GET /companies/{pbId}/bio + /industries + /most-recent-financing
export async function fetchCompanyBio(pbId: string): Promise<CompanyOverview | null> {
  if (!API_KEY) return null
  try {
    // Fetch bio, industries, and financing in parallel
    const [bioRes, indRes, finRes] = await Promise.allSettled([
      client.get(`/companies/${pbId}/bio`),
      client.get(`/companies/${pbId}/industries`),
      client.get(`/companies/${pbId}/most-recent-financing`),
    ])

    if (bioRes.status === "rejected") throw bioRes.reason
    const data = bioRes.value.data

    // Industries from dedicated endpoint
    const indData  = indRes.status === "fulfilled" ? indRes.value.data : null
    const primary  = (indData?.industries ?? []).find((i: { primary: boolean }) => i.primary) ?? indData?.industries?.[0]
    const sector   = primary?.industrySector?.description ?? data.financingStatus?.description

    // Prefer "FinTech" vertical if present, else first vertical, else sector
    const verticals: Array<{ code: string; description: string }> = indData?.verticals ?? []
    const fintechVertical = verticals.find(v => v.code === "FT")
    const primaryVertical = fintechVertical ?? verticals[0]
    const industry = primaryVertical?.description ?? sector ?? "Unknown"

    // Tags: other verticals excluding the one used as the industry label
    const tags: string[] = verticals
      .filter(v => v.code !== (primaryVertical?.code ?? ""))
      .map(v => v.description)
      .slice(0, 3)

    // Financing: post-money valuation from most-recent-financing
    const fin = finRes.status === "fulfilled" ? finRes.value.data : null
    const valuation  = fin?.lastFinancingValuation?.amount
      ? formatCurrency(fin.lastFinancingValuation.amount) : undefined

    // Total raised comes from bio.totalMoneyRaised (more accurate than lastFinancingSize)
    const totalRaised = data.totalMoneyRaised?.amount
      ? formatCurrency(data.totalMoneyRaised.amount) : undefined

    return {
      description: data.description ?? "",
      industry,
      sector,
      stage:        data.financingStatus?.description,
      founded:      data.yearFounded ?? undefined,
      employees:    data.employees != null ? String(data.employees) : undefined,
      valuation,
      totalRaised,
      website:      data.website ? `https://${data.website.replace(/^https?:\/\//, "")}` : undefined,
      tags:         tags.length ? tags : [industry].filter(Boolean),
      logoUrl:      undefined,
    }
  } catch (err) {
    console.error("[PitchBook] fetchCompanyBio error:", err)
    return null
  }
}

// ─── Location: GET /entities/{pbId}/locations ─────────────────────────────────
export async function fetchCompanyLocation(pbId: string): Promise<Location | null> {
  if (!API_KEY) return null
  try {
    const { data } = await client.get(`/entities/${pbId}/locations`)
    const hq = data.hqOffice ?? {}
    return {
      address: [hq.addressLine1, hq.addressLine2].filter(Boolean).join(", ") || undefined,
      city:       hq.city,
      country:    hq.country,
      region:     hq.stateProvince ?? hq.globalSubRegion,
      postalCode: hq.postCode,
    }
  } catch (err) {
    console.error("[PitchBook] fetchCompanyLocation error:", err)
    return null
  }
}

// ─── People: GET /entities/{pbId}/people ─────────────────────────────────────
export async function fetchCompanyContact(pbId: string): Promise<Contact | null> {
  if (!API_KEY) return null
  try {
    const { data } = await client.get(`/entities/${pbId}/people`)
    const pc = data.primaryContact ?? data.currentTeam?.[0] ?? {}
    return {
      name:  pc.fullName ?? pc.name ?? "Unknown",
      title: pc.title ?? "",
      email: pc.email,
      linkedin: pc.linkedinUrl,
    }
  } catch (err) {
    console.error("[PitchBook] fetchCompanyContact error:", err)
    return null
  }
}

// ─── Investors: GET /companies/{pbId}/investors ───────────────────────────────
export async function fetchInvestors(pbId: string): Promise<Investor[] | null> {
  if (!API_KEY) return null
  try {
    const { data } = await client.get(`/companies/${pbId}/investors`)
    return (data.investors ?? []).map((inv: {
      investorName: string
      investorTypes?: Array<{ type: { description: string }; primary: boolean }>
      holding?: string
    }) => ({
      name:  inv.investorName,
      type:  inv.investorTypes?.find(t => t.primary)?.type.description ?? "VC",
      rounds: [],
      isLead: false,
      confidenceScore: 0.95,
    }))
  } catch (err) {
    console.error("[PitchBook] fetchInvestors error:", err)
    return null
  }
}

// ─── Deals: GET /companies/{pbId}/deals + GET /deals/{dealId}/bio ─────────────
export async function fetchDeals(pbId: string): Promise<Deal[] | null> {
  if (!API_KEY) return null
  try {
    const { data: listData } = await client.get(`/companies/${pbId}/deals`)
    const dealList: Array<{ dealId: string; dealDate?: string; dealType1?: { description: string } }> =
      Array.isArray(listData) ? listData : (listData?.deals ?? [])

    // Fetch bios for up to 10 most recent deals in parallel
    const recent = [...dealList]
      .sort((a, b) => new Date(b.dealDate ?? 0).getTime() - new Date(a.dealDate ?? 0).getTime())
      .slice(0, 10)

    const bios = await Promise.allSettled(recent.map(d => fetchDealBio(d.dealId)))

    return bios.map((r, i) => {
      const bio = r.status === "fulfilled" ? r.value : null
      const list = recent[i]
      const amount = bio?.dealSize?.amount
      const valuation = bio?.postMoneyValuation?.amount
      return {
        round:  bio?.dealType1?.description ?? list.dealType1?.description ?? "Unknown",
        amount: amount ? formatCurrency(amount) : "Undisclosed",
        amountUsd: amount,
        date:   bio?.dealDate ?? list.dealDate ?? "",
        postMoneyValuation: valuation ? formatCurrency(valuation) : undefined,
        leadInvestors: [],
        stage: bio?.dealType1?.description ?? "Unknown",
      }
    }).filter(d => d.date)
  } catch (err) {
    console.error("[PitchBook] fetchDeals error:", err)
    return null
  }
}

async function fetchDealBio(dealId: string): Promise<{
  dealId: string; dealDate?: string
  dealType1?: { description: string }
  dealSize?: { amount: number; currency: string }
  postMoneyValuation?: { amount: number }
} | null> {
  try {
    const { data } = await client.get(`/deals/${dealId}/bio`)
    return data
  } catch {
    return null
  }
}

// ─── Combined overview (orchestrator compat) ──────────────────────────────────
export async function fetchCompanyOverview(pbId: string): Promise<{
  overview: CompanyOverview
  contact: Contact
  location: Location
  rawCompany: { website?: string }
} | null> {
  const [bio, contact, location] = await Promise.allSettled([
    fetchCompanyBio(pbId),
    fetchCompanyContact(pbId),
    fetchCompanyLocation(pbId),
  ])
  const overview = bio.status === "fulfilled" ? bio.value : null
  if (!overview) return null
  return {
    overview,
    contact: (contact.status === "fulfilled" ? contact.value : null) ?? { name: "Unknown", title: "" },
    location: (location.status === "fulfilled" ? location.value : null) ?? {},
    rawCompany: { website: overview.website },
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatCurrency(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}
