import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const gracePeriodEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Listings past expiresAt but within 7-day grace → send warning notification
  const expiringListings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: now, gte: gracePeriodEnd },
    },
    select: { id: true, agentId: true, projectName: true, location: true },
  })

  let notified = 0
  for (const listing of expiringListings) {
    const existing = await prisma.notification.findFirst({
      where: { listingId: listing.id, type: "LISTING_EXPIRING", read: false },
    })
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: listing.agentId,
          listingId: listing.id,
          type: "LISTING_EXPIRING",
          message: `"${listing.projectName} in ${listing.location}" is over 30 days old — still active?`,
        },
      })
      notified++
    }
  }

  // Listings past expiresAt + 7 days → expire them
  const toExpire = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: gracePeriodEnd },
    },
    select: { id: true, agentId: true, projectName: true, location: true },
  })

  let expired = 0
  for (const listing of toExpire) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "EXPIRED" },
    })
    const existing = await prisma.notification.findFirst({
      where: { listingId: listing.id, type: "LISTING_EXPIRED" },
    })
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: listing.agentId,
          listingId: listing.id,
          type: "LISTING_EXPIRED",
          message: `"${listing.projectName} in ${listing.location}" has been expired after 37 days.`,
        },
      })
    }
    expired++
  }

  return NextResponse.json({ warned: notified, expired })
}
