"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import theme, { p } from "@/lib/theme"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push("/market-times")
      router.refresh()
    } else {
      setError("Incorrect password. Try again.")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: theme.background, position: "relative", overflow: "hidden" }}
    >
      {/* Blurred background blobs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: p(0.1), filter: "blur(120px)", top: -200, left: -200 }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: p(0.08), filter: "blur(100px)", bottom: -150, right: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: p(0.06), filter: "blur(80px)", top: "40%", right: "30%" }} />
      </div>

      {/* Content */}
      <div className="w-full max-w-sm px-4" style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo iconSize={48} theme="light" />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: theme.primary,
            boxShadow: `0 24px 80px ${p(0.25)}, 0 4px 16px ${p(0.15)}`,
          }}
        >
          <h1
            className="text-white text-2xl font-bold mb-1"
            style={{ fontFamily: "Cambria, Georgia, serif" }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            Enter your password to access the platform
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: error
                    ? `1.5px solid ${theme.primary}`
                    : "1.5px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => {
                  if (!error) e.currentTarget.style.border = `1.5px solid ${p(0.5)}`
                }}
                onBlur={(e) => {
                  if (!error) e.currentTarget.style.border = "1.5px solid rgba(255,255,255,0.08)"
                }}
              />
              {error && (
                <p className="text-xs mt-2" style={{ color: theme.primary }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all mt-1"
              style={{
                background: loading || !password ? p(0.35) : theme.primary,
                cursor: loading || !password ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: p(0.35) }}>
          FinSight Company Intelligence Platform
        </p>
      </div>
    </div>
  )
}
