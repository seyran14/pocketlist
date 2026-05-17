import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // All ACTIVE listings past their expiresAt
  const expiredListings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    select: { id: true, agentId: true, projectName: true, location: true },
  })

  // Create LISTING_EXPIRING notification only if no unread one exists yet
  // (prevents daily spam on repeated runs)
  let notified = 0
  for (const listing of expiredListings) {
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

  return NextResponse.json({ checked: expiredListings.length, notified })
}
