import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          reraNumber: true,
        },
      },
    },
  })

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const {
    notes, action,
    // strip read-only / relation fields the client may echo back
    id: _id, createdAt: _ca, updatedAt: _ua, expiresAt: _ea,
    agentId: _agentId, agent: _agent,
    ...rest
  } = body
  const data: Record<string, unknown> = { ...rest }

  // Agents can only set these statuses; EXPIRED is reserved for the cron job
  if (data.status !== undefined && !["ACTIVE", "RESERVED", "SOLD"].includes(data.status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  if (notes !== undefined) data.description = notes ?? null
  if (data.bedrooms === null) delete data.bedrooms

  if (action === "refresh") {
    data.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }

  const isRent = (data.listingType ?? listing.listingType) === "RENT"

  if (data.price !== undefined) {
    data.priceLabel = isRent
      ? `AED ${Number(data.price).toLocaleString("en-AE")} / yr`
      : `AED ${Number(data.price).toLocaleString("en-AE")}`
  }

  const beds = (data.bedrooms ?? listing.bedrooms) as string
  const loc = (data.location ?? listing.location) as string
  const price = (data.price ?? listing.price) as number
  const bedsLabel = beds === "Studio" ? "Studio" : `${beds}BR`
  if (data.bedrooms !== undefined || data.location !== undefined || data.price !== undefined || data.listingType !== undefined) {
    data.title = isRent
      ? `${bedsLabel} in ${loc} – AED ${Math.round(price / 1000)}K/yr`
      : `${bedsLabel} in ${loc} – AED ${Math.round(price / 1000)}K`
  }

  try {
    const updated = await prisma.listing.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.listing.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
