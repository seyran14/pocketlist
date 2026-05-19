import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/ratelimit"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { allowed } = checkRateLimit(`contact:${session.user.id}`, 20)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many contact requests today (20/day). Try again tomorrow." },
      { status: 429 }
    )
  }

  const { id } = await ctx.params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      agent: {
        select: { id: true, name: true, phone: true, whatsapp: true, telegram: true, email: true, contactPref: true },
      },
    },
  })

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { agent } = listing
  const contact: Record<string, string | null> = { name: agent.name }

  const prefs = agent.contactPref
    ? agent.contactPref.split(",").map((s) => s.trim())
    : ["EMAIL"]

  if (prefs.includes("PHONE")) {
    contact.phone = agent.phone
  }
  if (prefs.includes("WHATSAPP")) {
    contact.whatsapp = agent.whatsapp
  }
  if (prefs.includes("TELEGRAM")) {
    contact.telegram = agent.telegram
  }
  if (prefs.includes("EMAIL")) {
    contact.email = agent.email
  }

  await prisma.notification.create({
    data: {
      userId: listing.agentId,
      listingId: id,
      type: "CONTACT_REVEALED",
      message: `Someone viewed your contact info for ${listing.projectName}`,
    },
  })

  return NextResponse.json(contact)
}
