"use client"
import { useState, type ReactNode } from "react"
import type { FieldMeta, FreshnessStatus } from "@/types"
import theme, { p } from "@/lib/theme"

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

type CardVariant = "white" | "navy" | "glass"

export function SectionCard({ title, sub, action, children, className, childrenClassName, glass = false, variant = "white" }: {
  title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; childrenClassName?: string; glass?: boolean; variant?: CardVariant
}) {
  const v: CardVariant = glass ? "glass" : variant
  const isDark = v === "navy"

  const containerStyle: React.CSSProperties =
    v === "glass" ? { background: "rgba(255,255,255,0.58)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(255,255,255,0.72)", boxShadow: "0 2px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" }
    : v === "navy" ? { background: theme.primary, border: "1px solid rgba(255,255,255,0.07)", boxShadow: `0 4px 28px ${p(0.25)}` }
    :                { background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04)" }

  const headerBorder = v === "glass" ? "border-b border-white/30" : isDark ? "border-b border-white/10" : "border-b border-gray-50"
  const titleColor   = isDark ? "text-white" : "text-gray-900"
  const subColor     = isDark ? "text-white/50" : "text-gray-400"

  return (
    <div
      className={cn(
        v === "glass" ? "rounded-3xl" : "rounded-2xl",
        !isDark && v !== "glass" ? "border border-black/[0.06]" : "",
        "overflow-hidden flex flex-col",
        className,
      )}
      style={containerStyle}
    >
      <div className={cn("flex items-center justify-between px-5 py-3.5 flex-shrink-0", headerBorder)}>
        <div>
          <div className={cn("text-sm font-bold", titleColor)}>{title}</div>
          {sub && <div className={cn("text-[11px] mt-0.5", subColor)}>{sub}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={cn("flex flex-col", childrenClassName)}>
        {children}
      </div>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  fresh:   "bg-green-50 text-green-700",
  stale:   "bg-amber-50 text-amber-700",
  expired: "bg-red-50   text-red-700",
  missing: "bg-gray-100 text-gray-500",
}
const DOT_COLORS: Record<string, string> = {
  fresh:   "#16a34a",
  stale:   "#d97706",
  expired: "#dc2626",
  missing: "#9ca3af",
}

export function FreshnessPill({ meta, fieldName }: { meta: FieldMeta; fieldName: string }) {
  const [open, setOpen] = useState(false)
  const status = meta.status || "missing"
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(o => !o)} className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-opacity hover:opacity-75 ${STATUS_STYLES[status] ?? STATUS_STYLES.missing}`}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DOT_COLORS[status] ?? DOT_COLORS.missing }} />
        {meta.sourceName} · {status.charAt(0).toUpperCase() + status.slice(1)}
        {meta.ageDays > 0 && ` · ${meta.ageDays}d`}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-100 rounded-xl p-3 w-56" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{fieldName} provenance</div>
          {([["Source", meta.sourceName], ["Tier", meta.sourceTier], ["Fetched", meta.fetchedAt.substring(0,10)], ["Expires", meta.ttlExpiresAt.substring(0,10)], ["Status", meta.status], ["Confidence", meta.confidenceScore.toFixed(2)], ["Fallback", meta.isFallback ? "Yes" : "No"]] as [string,string][]).map(([l,v]) => (
            <div key={l} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
              <span className="text-[11px] text-gray-400">{l}</span>
              <span className="text-[11px] font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function StaleBanner({ message, onRefresh }: { message: string; onRefresh?: () => void }) {
  return (
    <div className="mx-5 mb-3 px-3.5 py-2 bg-amber-50 rounded-lg flex items-center justify-between gap-3">
      <span className="text-[12px] text-amber-700">{message}</span>
      {onRefresh && <button onClick={onRefresh} className="flex-shrink-0 text-[11px] font-bold text-amber-700 border border-amber-300 rounded-full px-3 py-1 hover:bg-amber-100 transition-colors">Refresh →</button>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className ?? ""}`} />
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: theme.primary }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.15" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="#9ca3af" strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 7v4M10 13v1"/></svg>
      </div>
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      {sub && <div className="text-xs text-gray-400 mt-1 max-w-xs">{sub}</div>}
    </div>
  )
}

export function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value > 0) return <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[11px] font-bold px-2 py-0.5 rounded-full">↑ {value}{suffix}</span>
  if (value < 0) return <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full">↓ {Math.abs(value)}{suffix}</span>
  return <span className="inline-flex items-center gap-0.5 bg-gray-100 text-gray-500 text-[11px] font-bold px-2 py-0.5 rounded-full">— 0{suffix}</span>
}

export function CardSkeleton() {
  return <div className="animate-pulse bg-gray-100 rounded-2xl h-48 w-full" />
}
