import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth-cookie"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API through without a session
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.AUTH_SECRET

  if (!token || !secret || !(await verifySessionToken(token, secret))) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
