"use client"

import { useLocale, useT } from "@/components/I18nProvider"
import Link from "next/link"
import Image from "next/image"
import { Building2 } from "lucide-react"
import { cn, enumLabel, formatAvailableDate, isAvailableLater, formatPrice, formatRentPrice, formatArea, formatBeds, daysAgo, localizePriceLabel } from "@/lib/utils"
import { photoUrl } from "@/lib/photos-shared"
import { CardSaveButton } from "./CardSaveButton"
import { motion, type Variants } from "motion/react"
import { spring } from "@/lib/motion"

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
  availableFrom?: string | null
  propertyType: string
  photos?: { id: string }[]
}

// Hover lifts the photo inside its frame; a press settles the whole card on pointer-down.
const CARD: Variants = { rest: { scale: 1 }, hover: { scale: 1 }, press: { scale: 0.98 } }
const PHOTO: Variants = { rest: { scale: 1 }, hover: { scale: 1.03 }, press: { scale: 1.03 } }

const BADGE = "rounded-full bg-card px-3 py-1 text-xs font-semibold text-card-foreground shadow-badge"

// Leave `saved` undefined to show the card without a heart.
export function ListingCard({ listing, index = 0, saved }: { listing: ListingCardData; index?: number; saved?: boolean }) {
  const t = useT()
  const locale = useLocale()
  const isReserved = listing.status === "RESERVED"
  const isDistress = listing.isDistress
  const availableLater = isAvailableLater(listing.availableFrom)
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
        className="block rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <motion.div initial="rest" animate="rest" whileHover="hover" whileTap="press" variants={CARD} transition={spring} className="flex flex-col">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
          {cover ? (
            <motion.div variants={PHOTO} transition={spring} className="absolute inset-0">
            <Image
              src={photoUrl(cover.id, "thumb")}
              alt={`${listing.projectName}, ${listing.location}`}
              fill
              unoptimized
              loading={index < 4 ? "eager" : "lazy"}
              className="object-cover"
            />
            </motion.div>
          ) : (
            <Building2 size={32} className="text-muted-foreground/40" aria-hidden="true" />
          )}
          {(isDistress || isReserved || availableLater) && (
            <div className="absolute start-3 top-3 flex flex-col items-start gap-1">
              {isReserved && <span className={BADGE}>{t("Under Offer")}</span>}
              {isDistress && <span className={BADGE}>{t("Distress Deal")}</span>}
              {availableLater && (
                <span className={BADGE} suppressHydrationWarning>
                  {t("From {date}", { date: formatAvailableDate(listing.availableFrom!, locale) })}
                </span>
              )}
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
        </motion.div>
      </Link>
      {saved !== undefined && <CardSaveButton listingId={listing.id} initialSaved={saved} />}
    </div>
  )
}
