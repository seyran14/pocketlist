import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid"
import { ListingFilters } from "@/components/listings/ListingFilters"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Prisma } from "@/lib/generated/prisma/client"

type SearchParams = {
  q?: string
  location?: string
  propertyType?: string
  bedrooms?: string
  priceMin?: string
  priceMax?: string
  status?: string
  listingType?: string
  sort?: string
  page?: string
}

async function getListings(sp: SearchParams) {
  const sort = sp.sort ?? "newest"
  const page = parseInt(sp.page ?? "1", 10)
  const limit = 24

  const where: Prisma.ListingWhereInput = {
    status: { in: ["ACTIVE", "RESERVED"] },
  }

  if (sp.q) {
    const q = sp.q.trim()
    where.OR = [
      { projectName: { contains: q } },
      { location: { contains: q } },
      { subLocation: { contains: q } },
      { description: { contains: q } },
    ]
  }

  if (sp.location) {
    where.location = { in: sp.location.split(",").map((l) => l.trim()) }
  }
  if (sp.propertyType) {
    where.propertyType = {
      in: sp.propertyType.split(",") as Prisma.EnumPropertyTypeFilter["in"],
    }
  }
  if (sp.bedrooms) {
    where.bedrooms = { in: sp.bedrooms.split(",") }
  }
  if (sp.priceMin || sp.priceMax) {
    where.price = {
      ...(sp.priceMin ? { gte: parseFloat(sp.priceMin) } : {}),
      ...(sp.priceMax ? { lte: parseFloat(sp.priceMax) } : {}),
    }
  }
  if (sp.status === "ready") where.handover = "Ready"
  if (sp.status === "offplan") where.handover = { not: "Ready" }
  if (sp.status === "distress") where.isDistress = true
  if (sp.listingType === "SALE" || sp.listingType === "RENT") {
    where.listingType = sp.listingType as "SALE" | "RENT"
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
      },
    }),
    prisma.listing.count({ where }),
  ])

  return { listings, total, page, pages: Math.ceil(total / limit) }
}

async function getLocations() {
  const rows = await prisma.listing.findMany({
    where: { status: { in: ["ACTIVE", "RESERVED"] } },
    select: { location: true },
    distinct: ["location"],
    orderBy: { location: "asc" },
  })
  return rows.map((r) => r.location)
}

async function ListingsSection({ searchParams }: { searchParams: SearchParams }) {
  const data = await getListings(searchParams)
  const serialized = data.listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt.toISOString(),
  }))

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        {data.total} listing{data.total !== 1 ? "s" : ""}
      </p>
      <ListingGrid listings={serialized} />
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {data.page > 1 ? (
            <Link href={pageUrl(searchParams, data.page - 1)}>
              <Button variant="outline" size="sm">← Prev</Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>← Prev</Button>
          )}
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.pages}
          </span>
          {data.page < data.pages ? (
            <Link href={pageUrl(searchParams, data.page + 1)}>
              <Button variant="outline" size="sm">Next →</Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>Next →</Button>
          )}
        </div>
      )}
    </>
  )
}

function pageUrl(sp: SearchParams, page: number) {
  const params = new URLSearchParams(sp as Record<string, string>)
  if (page <= 1) params.delete("page")
  else params.set("page", String(page))
  const qs = params.toString()
  return qs ? `/?${qs}` : "/"
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const locations = await getLocations()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-1 text-center">Dubai Properties</h1>
        <p className="text-muted-foreground text-sm mb-5 text-center">
          Browse listings from agents. Sign in to reveal contact details.
        </p>

        <ListingFilters locations={locations} />
        <Separator className="mt-4 mb-5" />

        <Suspense fallback={<ListingGridSkeleton />}>
          <ListingsSection searchParams={sp} />
        </Suspense>
      </main>
    </div>
  )
}
