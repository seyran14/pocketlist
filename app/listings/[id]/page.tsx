import { getLocale, getT } from "@/lib/i18n/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { ContactButton } from "@/components/listings/ContactButton"
import { ShareMenu } from "@/components/listings/ShareMenu"
import { ContactBar } from "@/components/listings/ContactBar"
import { SaveButton } from "@/components/listings/SaveButton"
import { PhotoGallery } from "@/components/listings/PhotoGallery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { enumLabel, formatAvailableShort, isAvailableLater, formatPrice, formatRentPrice, formatMonthlyRent, formatArea, formatBeds, daysAgo, isPublicStatus, localizePriceLabel, furnishedValue, floorValue, viewValue } from "@/lib/utils"
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
    title,
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

  // "1BR" reads naturally in English only; other languages spell the bedrooms out.
  const bedsTitle = listing.bedrooms === "Studio" ? t("Studio")
    : locale === "en" ? formatBeds(listing.bedrooms, t)
    : countOf("bedroom", Number(listing.bedrooms) || 0, locale)

  const isRent = listing.listingType === "RENT"
  const priceText = listing.priceLabel ? localizePriceLabel(listing.priceLabel, t) : isRent ? formatRentPrice(listing.price, t) : formatPrice(listing.price)
  const priceNote = [
    isRent ? formatMonthlyRent(listing.price, t) : null,
    isRent && listing.chequeCount ? countOf("cheque", listing.chequeCount, locale) : null,
  ].filter(Boolean).join(" · ")
  const canSave = !isOwner && session?.user?.role !== "AGENT"
  const owner = (
    <div>
      <Link href={`/owners/${listing.agent.id}`} className="font-medium hover:underline underline-offset-4">
        {listing.agent.name ?? t("Owner")}
      </Link>
      <p className="text-xs text-muted-foreground">{t("Owner")}</p>
    </div>
  )
  const editLink = (
    <Link href={`/dashboard/listings/${listing.id}/edit`} className="block">
      <Button variant="outline" className="w-full">{t("Edit listing")}</Button>
    </Link>
  )
  const shareTitle = `${listing.title || listing.projectName} · ${listing.priceLabel ?? formatPrice(listing.price)}`

  // Label and value in one row; rows without a value are left out.
  const fieldRow = (label: string, value: string | number | null | undefined) => {
    if (!value && value !== 0) return null
    return (
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-sm text-muted-foreground">{t(label)}</dt>
        <dd className="text-sm font-medium text-end">{value}</dd>
      </div>
    )
  }

  // The four facts people compare first, set large so they scan before the details.
  const keyFacts = [
    { label: "Bedrooms", value: listing.bedrooms === "Studio" ? t("Studio") : listing.bedrooms },
    { label: "Bathrooms", value: listing.bathrooms },
    { label: "Area", value: listing.areaSqft || listing.areaSqm ? formatArea(listing.areaSqft, listing.areaSqm, t) : null },
    { label: "Property type", value: t(enumLabel(listing.propertyType)) },
  ].filter((fact) => fact.value)

  const priceMain = listing.priceLabel ? localizePriceLabel(listing.priceLabel, t) : formatPrice(listing.price)
  const price = (
    <div id="listing-price">
      <p className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">
        {priceMain}
        {isRent && !listing.priceLabel && <span className="ms-1.5 text-base font-normal tracking-normal text-muted-foreground">{t("/ yr")}</span>}
        {listing.isDistress && listing.originalPrice && (
          <span className="ms-3 text-base font-normal text-muted-foreground line-through">
            {t("OP: {price}", { price: formatPrice(listing.originalPrice) })}
          </span>
        )}
      </p>
      {priceNote && <p className="mt-1 text-sm text-muted-foreground tabular-nums">{priceNote}</p>}
    </div>
  )

  // A rented home stays visible, but its owner can no longer be contacted about it.
  const isRented = listing.status === "SOLD"
  const contact = isRented ? (
    <p className="rounded-xl border bg-muted px-4 py-3 text-sm text-muted-foreground">{t("This home is already rented.")}</p>
  ) : (
    <ContactButton listingId={listing.id} isLoggedIn={isLoggedIn} />
  )

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="card-animate min-w-0 flex-1">
            {listing.photos.length > 0 && (
              <PhotoGallery photos={listing.photos} alt={`${listing.projectName}, ${listing.location}`} />
            )}

            <header className="mt-6">
              {(listing.status === "RESERVED" || isRented || listing.isDistress) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {listing.status === "RESERVED" && <Badge variant="secondary">{t("Under Offer")}</Badge>}
                  {isRented && <Badge variant="secondary">{t("Rented")}</Badge>}
                  {listing.isDistress && <Badge variant="destructive">{t("Distress Deal")}</Badge>}
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-semibold sm:text-[28px]">
                  {t("{beds} in {location}", { beds: bedsTitle, location: listing.location })}
                </h1>
                <div className="flex gap-2 lg:hidden">
                  <ShareMenu title={shareTitle} url={`${BASE_URL}/listings/${listing.id}`} iconOnly />
                  {canSave && <SaveButton listingId={listing.id} initialSaved={!!savedListing} />}
                </div>
              </div>
              <p className="mt-1 text-muted-foreground">
                {listing.projectName}
                {listing.subLocation && !listing.projectName.toLowerCase().includes(listing.subLocation.toLowerCase()) && ` · ${listing.subLocation}`}
              </p>
            </header>

            {/* On phones the price follows the title; on desktop it sits in the side panel. */}
            <div className="mt-5 space-y-4 lg:hidden">
              {price}
              <div id="listing-contact">{contact}</div>
              {owner}
              {isOwner && editLink}
            </div>

            {keyFacts.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-5 sm:grid-cols-4">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{t(fact.label)}</dt>
                    <dd className="mt-0.5 truncate text-lg font-semibold tracking-[-0.01em]">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <section>
                <h2 className="text-base font-semibold">{t("The home")}</h2>
                <dl className="mt-1 divide-y">
                  {fieldRow("Floor", listing.floor ? floorValue(listing.floor, t) : null)}
                  {fieldRow("View", listing.view ? viewValue(listing.view) : null)}
                  {fieldRow("Furnished", listing.furnished ? furnishedValue(listing.furnished, t) : null)}
                  {fieldRow("Parking", listing.parkingSpots ? countOf("space", listing.parkingSpots, locale) : null)}
                  {fieldRow("Plot", listing.plotSqft || listing.plotSqm ? formatArea(listing.plotSqft, listing.plotSqm, t) : null)}
                  {!isRent && fieldRow("Handover", listing.handover && t(listing.handover))}
                </dl>
              </section>

              <section>
                <h2 className="text-base font-semibold">{t(isRent ? "Rental terms" : "Terms")}</h2>
                <dl className="mt-1 divide-y">
                  {isRent && fieldRow("Cheques", listing.chequeCount)}
                  {fieldRow("Available", isAvailableLater(listing.availableFrom) ? t("From {date}", { date: formatAvailableShort(listing.availableFrom!, locale) }) : t("Now"))}
                  {isRent && fieldRow("Ejari", t("After the contract is signed"))}
                  {listing.isRented && !isRent && fieldRow("Rental income", listing.rentAmount ? `${formatPrice(listing.rentAmount)} ${t("/ yr")}` : t("Rented"))}
                </dl>
              </section>
            </div>

            {listing.description && (
              <section className="mt-8">
                <h2 className="text-base font-semibold">{t("About this home")}</h2>
                <p dir="auto" className="mt-2 max-w-prose whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
              </section>
            )}

            <p className="mt-8 text-xs text-muted-foreground">{t("Listed {when}", { when: daysAgo(listing.createdAt, locale).toLocaleLowerCase(locale) })}</p>
          </div>

          {/* Side panel: one primary action, everything else quieter. */}
          <aside className="card-animate hidden w-80 shrink-0 lg:sticky lg:top-20 lg:block">
            <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-card">
              {price}
              {contact}
              <div className="border-t pt-4">{owner}</div>
              <div className="flex gap-2">
                <ShareMenu title={shareTitle} url={`${BASE_URL}/listings/${listing.id}`} />
                {canSave && <SaveButton listingId={listing.id} initialSaved={!!savedListing} />}
              </div>
              {isOwner && editLink}
            </div>
          </aside>
        </div>
      </main>

      {/* Phones: price and the main action stay in reach at the bottom of the screen. */}
      {!isRented && (
      <ContactBar watchId="listing-contact">
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap font-semibold tabular-nums">{priceText}</p>
          {priceNote && <p className="truncate text-xs text-muted-foreground tabular-nums">{priceNote}</p>}
        </div>
        <ContactButton listingId={listing.id} isLoggedIn={isLoggedIn} short className="shrink-0" />
      </ContactBar>
      )}
    </div>
  )
}
