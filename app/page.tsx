import { getT } from "@/lib/i18n/server"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { getSavedIds } from "@/lib/saved"
import { availabilityWhere } from "@/lib/listing-rules"
import { Navbar } from "@/components/Navbar"
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid"
import { ListingFilters } from "@/components/listings/ListingFilters"
import { PaginationBar } from "@/components/listings/PaginationBar"
import { headers } from "next/headers"
import type { Prisma } from "@/lib/generated/prisma/client"

type SearchParams = {
  q?: string
  location?: string
  propertyType?: string
  bedrooms?: string
  priceMin?: string
  priceMax?: string
  status?: string
  availableBy?: string
  listingType?: string
  sort?: string
  page?: string
}

async function getListings(sp: SearchParams) {
  const sort = sp.sort ?? "newest"
  const page = parseInt(sp.page ?? "1", 10)
  const ua = (await headers()).get("user-agent") ?? ""
  const isMobile = /iPhone|iPad|Android|Mobile/i.test(ua)
  const limit = isMobile ? 10 : 16

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
  where.AND = [availabilityWhere(sp.status, sp.availableBy)]
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
        availableFrom: true,
        isDistress: true,
        originalPrice: true,
        status: true,
        listingType: true,
        createdAt: true,
        expiresAt: true,
        photos: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
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
  const t = await getT()
  const data = await getListings(searchParams)
  const savedIds = await getSavedIds(data.listings.map((l) => l.id))
  const serialized = data.listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt.toISOString(),
    availableFrom: l.availableFrom?.toISOString() ?? null,
  }))

  return (
    <>
      <p className="mt-8 mb-5 text-[22px] leading-tight font-medium tracking-[-0.02em]">
        {t("Listings: {n}", { n: data.total })}
      </p>
      <ListingGrid listings={serialized} savedIds={savedIds} />
      {data.pages > 1 && (
        <PaginationBar
          page={data.page}
          pages={data.pages}
          prevUrl={pageUrl(searchParams, data.page - 1)}
          nextUrl={pageUrl(searchParams, data.page + 1)}
        />
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
  const t = await getT()
  const sp = await searchParams
  const locations = await getLocations()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {sp.page && parseInt(sp.page) > 1 ? null : (
          <>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight mb-1 text-center">{t("Dubai Properties")}</h1>
            <p className="text-muted-foreground text-sm mb-5 text-center">
              {t("Homes listed directly by their owners.")}
            </p>
          </>
        )}

        <ListingFilters locations={locations} />

        <Suspense fallback={<ListingGridSkeleton />}>
          <ListingsSection searchParams={sp} />
        </Suspense>
      </main>
    </div>
  )
}
