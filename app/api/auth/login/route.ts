import { NextResponse } from "next/server"
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth-cookie"

export async function POST(request: Request) {
  const { password } = await request.json()

  const authPassword = process.env.AUTH_PASSWORD
  const authSecret = process.env.AUTH_SECRET

  if (!authPassword || !authSecret) {
    return NextResponse.json(
      { error: "Server misconfigured — AUTH_PASSWORD and AUTH_SECRET must be set" },
      { status: 500 }
    )
  }

  if (password !== authPassword) {
    // Small delay to deter brute-force
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const token = await createSessionToken(authSecret)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })

  return response
}
