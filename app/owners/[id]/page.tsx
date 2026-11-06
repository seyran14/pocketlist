import { getT } from "@/lib/i18n/server"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSavedIds } from "@/lib/saved"
import { Navbar } from "@/components/Navbar"
import { ListingGrid } from "@/components/listings/ListingGrid"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function OwnerPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT()
  const { id } = await params

  const owner = await prisma.user.findUnique({
    where: { id, role: "AGENT" },
    select: { id: true, name: true, createdAt: true },
  })

  if (!owner) notFound()

  const rawListings = await prisma.listing.findMany({
    where: { agentId: id, status: { in: ["ACTIVE", "RESERVED"] } },
    orderBy: { createdAt: "desc" },
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
  })

  const listings = rawListings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
    availableFrom: l.availableFrom?.toISOString() ?? null,
  }))
  const savedIds = await getSavedIds(listings.map((l) => l.id))


  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("Browse listings")}
        </Link>

        <div className="card-animate">
          <h1 className="text-2xl font-bold">{owner.name ?? "Owner"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("Owner")} · {t("Active: {n}", { n: listings.length })}
          </p>
        </div>

        <Separator className="my-4 mb-6" />

        {listings.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground text-sm">
            {t("No active listings at the moment.")}
          </div>
        ) : (
          <ListingGrid listings={listings} savedIds={savedIds} />
        )}
      </main>
    </div>
  )
}
