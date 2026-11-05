"use client"

import { useT } from "@/components/I18nProvider"
import Link from "next/link"
import Image from "next/image"
import { Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, enumLabel, formatPrice, formatRentPrice, formatArea, formatBeds, daysAgo, localizePriceLabel } from "@/lib/utils"
import { photoUrl } from "@/lib/photos-shared"

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

export function ListingCard({ listing, index = 0 }: { listing: ListingCardData; index?: number }) {
  const t = useT()
  const isReserved = listing.status === "RESERVED"
  const isDistress = listing.isDistress
  const isRent = listing.listingType === "RENT"
  const cover = listing.photos?.[0]

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "card-animate group relative flex flex-col rounded-xl border bg-card p-4 transition-all duration-150 hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 active:scale-[0.98]",
        isDistress && "border-red-300/70 ring-1 ring-red-300/30 hover:border-red-300 hover:ring-red-300/50 dark:border-red-700/50 dark:ring-red-700/25",
        isReserved && "opacity-70"
      )}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
    >
      <div className="relative -mx-4 -mt-4 mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-[11px] bg-muted">
        {cover ? (
          <Image
            src={photoUrl(cover.id, "thumb")}
            alt={`${listing.projectName}, ${listing.location}`}
            fill
            unoptimized
            loading="lazy"
            className="object-cover"
          />
        ) : (
          <Building2 size={32} className="text-muted-foreground/40" aria-hidden="true" />
        )}
      </div>

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{listing.projectName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{listing.location}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isRent && (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">{t("For Rent")}</Badge>
          )}
          {isReserved && (
            <Badge variant="secondary" className="text-xs">{t("Under Offer")}</Badge>
          )}
          {isDistress && (
            <Badge variant="destructive" className="text-xs">{t("Distress Deal")}</Badge>
          )}

        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm mb-3">
        <span className="font-medium">{formatBeds(listing.bedrooms, t)}</span>
        <span className="text-muted-foreground capitalize">{t(enumLabel(listing.propertyType))}</span>
        <span className="text-muted-foreground">{formatArea(listing.areaSqft, listing.areaSqm, t)}</span>
        {(listing.plotSqft || listing.plotSqm) && (
          <span className="text-muted-foreground">
            {t("Plot {area}", { area: formatArea(listing.plotSqft, listing.plotSqm, t) })}
          </span>
        )}
        {listing.floor && (
          <span className="text-muted-foreground capitalize">{t(`${enumLabel(listing.floor)} floor`)}</span>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-border/60 flex items-end justify-between">
        <p className="text-lg font-bold tracking-tight">
          {listing.priceLabel ? localizePriceLabel(listing.priceLabel, t) : isRent ? formatRentPrice(listing.price, t) : formatPrice(listing.price)}
        </p>
        <div className="flex flex-col items-end gap-1">
          {listing.handover && (
            <span className="text-xs text-muted-foreground">{t(listing.handover)}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {daysAgo(new Date(listing.createdAt), t)}
          </span>
        </div>
      </div>
    </Link>
  )
}
