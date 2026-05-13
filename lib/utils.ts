export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}
export function formatCurrency(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}
export function formatDate(dateStr: string, locale = "en-SG"): string {
  if (!dateStr) return "—"
  try { return new Date(dateStr).toLocaleDateString(locale, { month: "short", year: "numeric" }) }
  catch { return dateStr }
}
export function getInitials(name: string, maxChars = 2): string {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase()).filter(Boolean).slice(0, maxChars).join("")
}
