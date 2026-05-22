import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseListingText } from "@/lib/ai"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  logger.setUser(session.user.id, session.user.email ?? undefined)

  const { allowed, remaining } = checkRateLimit(`parse:${session.user.id}`, 5)
  if (!allowed) {
    logger.warn("ratelimit.ai_parse", { userId: session.user.id })
    return NextResponse.json(
      { error: "Daily parse limit reached (5/day). Try again tomorrow." },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const rawText = body?.rawText
  if (!rawText?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 })
  }

  logger.info("ai.parse.start", { userId: session.user.id, textLength: rawText.length, remaining })

  try {
    const units = await parseListingText(rawText as string)
    if (!Array.isArray(units) || units.length === 0) {
      logger.warn("ai.parse.no_listings", { userId: session.user.id, textLength: rawText.length })
      return NextResponse.json({ error: "No listings detected" }, { status: 422 })
    }
    logger.info("ai.parse.success", { userId: session.user.id, unitCount: units.length })
    return NextResponse.json({ units })
  } catch (err) {
    logger.error("ai.parse.failed", err, { userId: session.user.id, textLength: rawText.length })
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 })
  }
}
