import { NextResponse } from "next/server"

// PDF generation has moved client-side (jsPDF in lib/exportPdf.ts).
// This route is no longer used.
export async function POST() {
  return NextResponse.json(
    { error: "PDF generation has moved client-side. This endpoint is deprecated." },
    { status: 410 }
  )
}
