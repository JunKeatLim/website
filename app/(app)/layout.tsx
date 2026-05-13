import { Navbar } from "@/components/layout/Navbar"
import theme, { p } from "@/lib/theme"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: theme.background, position: "relative" }}>

      {/* ── Blurred background blobs ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 750, height: 750, borderRadius: "50%", background: p(0.09), filter: "blur(130px)", top: -250, left: -200 }} />
        <div style={{ position: "absolute", width: 650, height: 650, borderRadius: "50%", background: p(0.07), filter: "blur(110px)", bottom: -200, right: -150 }} />
        <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: p(0.055), filter: "blur(90px)", top: "30%", right: "20%" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: p(0.05), filter: "blur(80px)", top: "55%", left: "15%" }} />
      </div>

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        <Navbar />
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden pt-[92px] md:pt-[96px]">
          {children}
        </div>
      </div>

    </div>
  )
}
