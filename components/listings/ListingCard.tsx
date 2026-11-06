"use client"

import { useT } from "@/components/I18nProvider"
import Link from "next/link"
import Image from "next/image"
import { Building2 } from "lucide-react"
import { cn, enumLabel, formatPrice, formatRentPrice, formatArea, formatBeds, daysAgo, localizePriceLabel } from "@/lib/utils"
import { photoUrl } from "@/lib/photos-shared"
import { CardSaveButton } from "./CardSaveButton"

type ListingCardData = {
  id: string
  projectName: string
  location: string
  bedrooms: string
  areaSqft: number | null
  areaSqm: number | null
  plotSqft: number | null
  plotSqm: number | null
  price: number
  priceLabel: string | null
  floor: string | null
  status: string
  listingType: string
  isDistress: boolean
  createdAt: string
  handover: string | null
  propertyType: string
  photos?: { id: string }[]
}

const BADGE = "rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#222222] shadow-sm"

// Leave `saved` undefined to show the card without a heart.
export function ListingCard({ listing, index = 0, saved }: { listing: ListingCardData; index?: number; saved?: boolean }) {
  const t = useT()
  const isReserved = listing.status === "RESERVED"
  const isDistress = listing.isDistress
  const isRent = listing.listingType === "RENT"
  const cover = listing.photos?.[0]

  const details = [formatBeds(listing.bedrooms, t), t(enumLabel(listing.propertyType)), formatArea(listing.areaSqft, listing.areaSqm, t)]
  if (listing.plotSqft || listing.plotSqm) details.push(t("Plot {area}", { area: formatArea(listing.plotSqft, listing.plotSqm, t) }))

  return (
    <div
      className={cn("card-animate group relative", isReserved && "opacity-70")}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
    >
      <Link
        href={`/listings/${listing.id}`}
        className="flex flex-col rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
          {cover ? (
            <Image
              src={photoUrl(cover.id, "thumb")}
              alt={`${listing.projectName}, ${listing.location}`}
              fill
              unoptimized
              loading="lazy"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <Building2 size={32} className="text-muted-foreground/40" aria-hidden="true" />
          )}
          {(isDistress || isReserved) && (
            <div className="absolute start-3 top-3 flex flex-col items-start gap-1">
              {isReserved && <span className={BADGE}>{t("Under Offer")}</span>}
              {isDistress && <span className={BADGE}>{t("Distress Deal")}</span>}
            </div>
          )}
        </div>

        <div className="mt-3 min-w-0 text-sm leading-5">
          <p className="truncate font-medium">{listing.projectName}</p>
          <p className="truncate text-muted-foreground">{listing.location}</p>
          <p className="truncate text-muted-foreground">{details.join(" · ")}</p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <p className="truncate font-semibold">
              {listing.priceLabel ? localizePriceLabel(listing.priceLabel, t) : isRent ? formatRentPrice(listing.price, t) : formatPrice(listing.price)}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">{daysAgo(new Date(listing.createdAt), t)}</span>
          </div>
        </div>
      </Link>
      {saved !== undefined && <CardSaveButton listingId={listing.id} initialSaved={saved} />}
    </div>
  )
}
