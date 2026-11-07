import { getLocale, getT } from "@/lib/i18n/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { ContactButton } from "@/components/listings/ContactButton"
import { CopyLinkButton } from "@/components/listings/CopyLinkButton"
import { SaveButton } from "@/components/listings/SaveButton"
import { PhotoGallery } from "@/components/listings/PhotoGallery"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { enumLabel, formatAvailableDate, isAvailableLater, formatPrice, formatRentPrice, formatMonthlyRent, formatArea, formatBeds, daysAgo, isPublicStatus, localizePriceLabel, furnishedValue, floorValue, viewValue } from "@/lib/utils"
import { countOf } from "@/lib/i18n/plural"
import Link from "next/link"

const BASE_URL = "https://pocketlist.ae"


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true, projectName: true, location: true, priceLabel: true, price: true, description: true, status: true },
  })
  if (!listing || !isPublicStatus(listing.status)) return {}
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
  const t = await getT()
  const locale = await getLocale()
  const { id } = await params
  const [session, listing] = await Promise.all([
    auth(),
    prisma.listing.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true } },
        photos: { select: { id: true }, orderBy: { position: "asc" } },
      },
    }),
  ])

  if (!listing) notFound()
  // Owners can preview a listing that's waiting for review.
  if (!isPublicStatus(listing.status) && session?.user?.id !== listing.agentId) notFound()

  // Count view (fire-and-forget, non-blocking)
  prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  // Warm OG image cache so it's ready when link is shared in Telegram/WhatsApp
  fetch(`${BASE_URL}/listings/${id}/opengraph-image`).catch(() => {})

  const isOwner = session?.user?.id === listing.agentId
  const isLoggedIn = !!session?.user

  const savedListing = session?.user?.id
    ? await prisma.savedListing.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: id } },
        select: { id: true },
      })
    : null

  const fieldRow = (label: string, value: string | number | null | undefined) => {
    if (!value && value !== 0) return null
    return (
      <div className="flex justify-between py-2.5 border-b border-border last:border-0">
        <span className="text-sm text-muted-foreground">{t(label)}</span>
        <span className="text-sm font-medium text-end">{value}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 card-animate" style={{ animationDelay: "0ms" }}>
            {listing.photos.length > 0 && (
              <div className="mb-5">
                <PhotoGallery photos={listing.photos} alt={`${listing.projectName}, ${listing.location}`} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {listing.status === "RESERVED" && (
                <Badge variant="secondary">{t("Under Offer")}</Badge>
              )}
              {listing.isDistress && (
                <Badge variant="destructive">{t("Distress Deal")}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {daysAgo(listing.createdAt, t)}
              </span>
            </div>

            <h1 className="text-2xl font-bold mb-1">
              {t("{beds} in {location}", { beds: formatBeds(listing.bedrooms, t), location: listing.location })}
            </h1>
            <p className="text-muted-foreground mb-4">
              {listing.projectName}
              {listing.subLocation && ` · ${listing.subLocation}`}
            </p>

            <p className="text-3xl font-bold">
              {listing.priceLabel ? localizePriceLabel(listing.priceLabel, t) : listing.listingType === "RENT" ? formatRentPrice(listing.price, t) : formatPrice(listing.price)}
              {listing.isDistress && listing.originalPrice && (
                <span className="ms-3 text-base font-normal text-muted-foreground line-through">
                  {t("OP: {price}", { price: formatPrice(listing.originalPrice) })}
                </span>
              )}
            </p>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              {listing.listingType === "RENT" && formatMonthlyRent(listing.price, t)}
              {listing.listingType === "RENT" && listing.chequeCount ? ` · ${t(listing.chequeCount === 1 ? "1 cheque" : "{n} cheques", { n: listing.chequeCount })}` : null}
            </p>

            <Separator className="mb-4" />

            <div className="rounded-lg border bg-card px-3">
              {fieldRow("Location", listing.location)}
              {fieldRow("Property type", t(enumLabel(listing.propertyType)))}
              {fieldRow("Bedrooms", listing.bedrooms === "Studio" ? t("Studio") : listing.bedrooms)}
              {fieldRow("Bathrooms", listing.bathrooms)}
              {fieldRow("Area", formatArea(listing.areaSqft, listing.areaSqm, t))}
              {fieldRow("Floor", listing.floor ? floorValue(listing.floor, t) : null)}
              {fieldRow("View", listing.view ? viewValue(listing.view) : null)}
              {fieldRow("Furnished", listing.furnished ? furnishedValue(listing.furnished, t) : null)}
              {fieldRow("Status", isAvailableLater(listing.availableFrom) ? t("Available from {date}", { date: formatAvailableDate(listing.availableFrom!, locale) }) : t("Available now"))}
              {listing.listingType !== "RENT" && fieldRow("Handover", listing.handover && t(listing.handover))}
              {fieldRow("Cheques", listing.chequeCount)}
              {fieldRow("Parking", listing.parkingSpots ? countOf("space", listing.parkingSpots, locale) : null)}
              {listing.isRented && listing.listingType !== "RENT" && fieldRow("Rental income", listing.rentAmount ? `${formatPrice(listing.rentAmount)} ${t("/ yr")}` : t("Rented"))}
            </div>

            {listing.description && (
              <div className="mt-6">
                <h2 className="font-semibold mb-2">{t("Notes")}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="card-animate w-full lg:w-72 shrink-0" style={{ animationDelay: "80ms" }}>
            <div className="sticky top-20 rounded-xl border bg-card p-4 space-y-4">
              <div>
                <Link href={`/owners/${listing.agent.id}`} className="font-semibold hover:underline underline-offset-4">
                  {listing.agent.name ?? t("Owner")}
                </Link>
                <p className="text-xs text-muted-foreground">{t("Owner")}</p>
              </div>

              <Separator />

              <ContactButton listingId={listing.id} isLoggedIn={isLoggedIn} />

              {session?.user?.role === "BUYER" && (
                <SaveButton listingId={listing.id} initialSaved={!!savedListing} />
              )}

              <CopyLinkButton />

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${listing.title || listing.projectName} – ${listing.priceLabel ?? `AED ${listing.price.toLocaleString("en-AE")}`}\nhttps://pocketlist.ae/listings/${listing.id}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-green-500" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a
                  href={"https://t.me/share/url?url=" + encodeURIComponent("https://pocketlist.ae/listings/" + listing.id) + "&text=" + encodeURIComponent((listing.title || listing.projectName) + " – " + (listing.priceLabel ?? "AED " + listing.price.toLocaleString("en-AE")))}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-blue-500" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              </div>

              {isOwner && (
                <div className="flex flex-col gap-2 pt-2">
                  <Link href={`/dashboard/listings/${listing.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full">
                      {t("Edit listing")}
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

