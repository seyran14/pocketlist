import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  logger.setUser(session.user.id, session.user.email ?? undefined)

  const { id } = await ctx.params
  const userId = session.user.id

  try {
    const existing = await prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId: id } },
    })

    if (existing) {
      await prisma.savedListing.delete({ where: { id: existing.id } })
      logger.info("listing.unsaved", { userId, listingId: id })
      return NextResponse.json({ saved: false })
    } else {
      await prisma.savedListing.create({ data: { userId, listingId: id } })
      logger.info("listing.saved", { userId, listingId: id })
      return NextResponse.json({ saved: true })
    }
  } catch (err) {
    logger.error("listing.save_failed", err, { userId, listingId: id })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
