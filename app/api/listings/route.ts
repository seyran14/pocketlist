import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Prisma } from "@/lib/generated/prisma/client"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const location = searchParams.get("location")
  const propertyType = searchParams.get("propertyType")
  const bedrooms = searchParams.get("bedrooms")
  const priceMin = searchParams.get("priceMin")
  const priceMax = searchParams.get("priceMax")
  const statusFilter = searchParams.get("status")
  const listingType = searchParams.get("listingType")
  const sort = searchParams.get("sort") ?? "newest"
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = 24

  const where: Prisma.ListingWhereInput = {
    status: { in: ["ACTIVE", "RESERVED"] },
  }

  if (location) {
    const locs = location.split(",").map((l) => l.trim())
    where.location = { in: locs }
  }
  if (propertyType) {
    const types = propertyType.split(",")
    where.propertyType = { in: types as Prisma.EnumPropertyTypeFilter["in"] }
  }
  if (bedrooms) {
    const beds = bedrooms.split(",")
    where.bedrooms = { in: beds }
  }
  if (priceMin) where.price = { ...((where.price as object) ?? {}), gte: parseFloat(priceMin) }
  if (priceMax) where.price = { ...((where.price as object) ?? {}), lte: parseFloat(priceMax) }

  if (statusFilter === "ready") where.handover = "Ready"
  if (statusFilter === "offplan") where.handover = { not: "Ready" }
  if (statusFilter === "distress") where.isDistress = true
  if (listingType === "SALE" || listingType === "RENT") {
    where.listingType = listingType
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : sort === "area_asc"
          ? { areaSqft: "asc" }
          : sort === "area_desc"
            ? { areaSqft: "desc" }
            : { createdAt: "desc" }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        projectName: true,
        location: true,
        subLocation: true,
        propertyType: true,
        bedrooms: true,
        areaSqft: true,
        areaSqm: true,
        plotSqft: true,
        plotSqm: true,
        price: true,
        priceLabel: true,
        floor: true,
        view: true,
        furnished: true,
        handover: true,
        isDistress: true,
        originalPrice: true,
        status: true,
        listingType: true,
        createdAt: true,
        expiresAt: true,
        agent: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.listing.count({ where }),
  ])

  return NextResponse.json({ listings, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // Duplicate check: same agent, same project + bedrooms combo
  const force = req.nextUrl.searchParams.get("force") === "1"
  if (!force && body.projectName && body.bedrooms) {
    const duplicate = await prisma.listing.findFirst({
      where: {
        agentId: session.user.id,
        projectName: { equals: body.projectName },
        bedrooms: body.bedrooms,
        status: { in: ["ACTIVE", "RESERVED"] },
      },
      select: { id: true },
    })
    if (duplicate) {
      return NextResponse.json(
        { error: "duplicate", listingId: duplicate.id },
        { status: 409 }
      )
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const { notes, ...rest } = body
  const beds = rest.bedrooms ?? "Studio"
  const price = rest.price ?? 0
  const isRent = rest.listingType === "RENT"
  const bedsLabel = beds === "Studio" ? "Studio" : `${beds}BR`

  const listing = await prisma.listing.create({
    data: {
      ...rest,
      agentId: session.user.id,
      expiresAt,
      bedrooms: beds,
      description: notes ?? null,
      priceLabel: price
        ? isRent
          ? `AED ${Number(price).toLocaleString("en-AE")} / yr`
          : `AED ${Number(price).toLocaleString("en-AE")}`
        : null,
      title: isRent
        ? `${bedsLabel} in ${rest.location} – AED ${Math.round(price / 1000)}K/yr`
        : `${bedsLabel} in ${rest.location} – AED ${Math.round(price / 1000)}K`,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
