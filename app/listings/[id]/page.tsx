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

const BASE_URL = "https://pocketlist.ae"

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
  const pageUrl = `${BASE_URL}/listings/${id}`
  const ogImage = `${BASE_URL}/listings/${id}/opengraph-image`
  return {
    title: `${title} | PocketList`,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: "PocketList",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
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

  // Warm OG image cache so it's ready when link is shared in Telegram/WhatsApp
  fetch(`${BASE_URL}/listings/${id}/opengraph-image`).catch(() => {})

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

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${listing.title || listing.projectName} – ${listing.priceLabel ?? `AED ${listing.price.toLocaleString("en-AE")}`}\nhttps://pocketlist.ae/listings/${listing.id}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-green-500" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a
                  href={"https://t.me/share/url?url=" + encodeURIComponent("https://pocketlist.ae/listings/" + listing.id) + "&text=" + encodeURIComponent((listing.title || listing.projectName) + " – " + (listing.priceLabel ?? "AED " + listing.price.toLocaleString("en-AE")))}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-blue-500" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              </div>

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
