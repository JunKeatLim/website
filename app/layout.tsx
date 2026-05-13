import type { Metadata } from "next"
import "./globals.css"
import theme, { PRIMARY_RGB } from "@/lib/theme"

export const metadata: Metadata = {
  title: "FinSight — Company Intelligence",
  description: "Singapore-focused company intelligence and market trends platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,500;0,600;1,700;1,800&family=Syne:wght@700;800&family=Mulish:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Inject theme CSS variables from lib/theme.ts */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --cp: ${theme.primary};
            --cp-rgb: ${PRIMARY_RGB};
            --cbg: ${theme.background};
            --canvas: ${theme.background};
          }
        `}} />
      </head>
      <body
        className="h-full w-full flex overflow-hidden"
        style={{
          fontFamily: "'Mulish', 'Segoe UI', system-ui, sans-serif",
          background: theme.background,
          color: theme.primary,
        }}
      >
        {children}
      </body>
    </html>
  )
}
