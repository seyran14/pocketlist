import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { ContactButton } from "@/components/listings/ContactButton"
import { CopyLinkButton } from "@/components/listings/CopyLinkButton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice, formatArea, formatBeds, daysAgo } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true, projectName: true, location: true, priceLabel: true, price: true, description: true },
  })
  if (!listing) return {}
  const title = listing.title || listing.projectName
  const price = listing.priceLabel ?? `AED ${listing.price.toLocaleString("en-AE")}`
  const description = `${price} · ${listing.location}${listing.description ? ` · ${listing.description.slice(0, 120)}` : ""}`
  return {
    title: `${title} | PocketList`,
    description,
    openGraph: { title, description },
  }
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [session, listing] = await Promise.all([
    auth(),
    prisma.listing.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, reraNumber: true } },
      },
    }),
  ])

  if (!listing || listing.status === "EXPIRED") notFound()

  // Count view (fire-and-forget, non-blocking)
  prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  const isOwner = session?.user?.id === listing.agentId
  const isLoggedIn = !!session?.user

  const fieldRow = (label: string, value: string | number | null | undefined) => {
    if (!value && value !== 0) return null
    return (
      <div className="flex justify-between py-2.5 border-b border-border last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-right">{value}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 card-animate" style={{ animationDelay: "0ms" }}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {listing.status === "RESERVED" && (
                <Badge variant="secondary">Under Offer</Badge>
              )}
              {listing.isDistress && (
                <Badge variant="destructive">Distress Deal</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {daysAgo(listing.createdAt)}
              </span>
            </div>

            <h1 className="text-2xl font-bold mb-1">
              {listing.title || `${formatBeds(listing.bedrooms)} in ${listing.location}`}
            </h1>
            <p className="text-muted-foreground mb-4">
              {listing.projectName}
              {listing.subLocation && ` · ${listing.subLocation}`}
            </p>

            <p className="text-3xl font-bold mb-6">
              {listing.priceLabel ?? formatPrice(listing.price)}
              {listing.isDistress && listing.originalPrice && (
                <span className="ml-3 text-base font-normal text-muted-foreground line-through">
                  OP: {formatPrice(listing.originalPrice)}
                </span>
              )}
            </p>

            <Separator className="mb-4" />

            <div className="rounded-lg border bg-card px-3">
              {fieldRow("Location", listing.location)}
              {fieldRow("Property type", listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase())}
              {fieldRow("Bedrooms", formatBeds(listing.bedrooms))}
              {fieldRow("Bathrooms", listing.bathrooms)}
              {fieldRow("Area", formatArea(listing.areaSqft, listing.areaSqm))}
              {fieldRow("Floor", listing.floor ? listing.floor.charAt(0) + listing.floor.slice(1).toLowerCase() + " floor" : null)}
              {fieldRow("View", listing.view)}
              {fieldRow("Furnished", listing.furnished ? listing.furnished.charAt(0) + listing.furnished.slice(1).toLowerCase() : null)}
              {fieldRow("Handover", listing.handover)}
              {fieldRow("Parking", listing.parkingSpots ? `${listing.parkingSpots} spot${listing.parkingSpots > 1 ? "s" : ""}` : null)}
              {listing.isRented && fieldRow("Rental income", listing.rentAmount ? formatPrice(listing.rentAmount) + "/yr" : "Rented")}
            </div>

            {listing.description && (
              <div className="mt-6">
                <h2 className="font-semibold mb-2">Notes</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="card-animate w-full lg:w-72 shrink-0" style={{ animationDelay: "80ms" }}>
            <div className="sticky top-20 rounded-xl border bg-card p-4 space-y-4">
              <div>
                <Link href={`/agents/${listing.agent.id}`} className="font-semibold hover:underline underline-offset-4">
                  {listing.agent.name ?? "Agent"}
                </Link>
                <p className="text-xs text-muted-foreground">Agent</p>
                {listing.agent.reraNumber && (
                  <p className="text-xs text-muted-foreground mt-1">
                    RERA: {listing.agent.reraNumber}
                  </p>
                )}
              </div>

              <Separator />

              <ContactButton listingId={listing.id} isLoggedIn={isLoggedIn} />

              {session?.user?.role === "BUYER" && (
                <SaveButton listingId={listing.id} />
              )}

              <CopyLinkButton />

              {isOwner && (
                <div className="flex flex-col gap-2 pt-2">
                  <Link href={`/dashboard/listings/${listing.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Edit listing
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SaveButton({ listingId }: { listingId: string }) {
  return (
    <form
      action={async () => {
        "use server"
        const { prisma } = await import("@/lib/prisma")
        const { auth } = await import("@/lib/auth")
        const session = await auth()
        if (!session?.user?.id) return
        await prisma.savedListing.create({
          data: { userId: session.user.id, listingId },
        }).catch(() => {})
      }}
    >
      <Button variant="outline" size="sm" type="submit" className="w-full">
        Save listing
      </Button>
    </form>
  )
}
