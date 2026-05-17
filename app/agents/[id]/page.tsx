import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { ListingCard } from "@/components/listings/ListingCard"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const agent = await prisma.user.findUnique({
    where: { id, role: "AGENT" },
    select: { id: true, name: true, reraNumber: true, createdAt: true },
  })

  if (!agent) notFound()

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
      isDistress: true,
      originalPrice: true,
      status: true,
      listingType: true,
      createdAt: true,
      expiresAt: true,
    },
  })

  const listings = rawListings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
  }))

  const plural = listings.length === 1 ? "" : "s"

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse listings
        </Link>

        <div className="card-animate">
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Agent · {listings.length} active listing{plural}
            {agent.reraNumber && ` · RERA ${agent.reraNumber}`}
          </p>
        </div>

        <Separator className="my-4 mb-6" />

        {listings.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground text-sm">
            No active listings at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} index={i} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
