import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseListingText } from "@/lib/ai"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { rawText } = await req.json()
  if (!rawText?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 })
  }

  try {
    const units = await parseListingText(rawText as string)
    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: "No listings detected" }, { status: 422 })
    }
    return NextResponse.json({ units })
  } catch (err) {
    console.error("[ai/parse]", err)
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 })
  }
}
