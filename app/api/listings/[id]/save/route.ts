import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const userId = session.user.id

  const existing = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId, listingId: id } },
  })

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false })
  } else {
    await prisma.savedListing.create({ data: { userId, listingId: id } })
    return NextResponse.json({ saved: true })
  }
}
