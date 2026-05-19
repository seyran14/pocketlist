"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn, formatPrice, formatRentPrice, formatArea, formatBeds, daysAgo } from "@/lib/utils"

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
}

export function ListingCard({ listing, index = 0 }: { listing: ListingCardData; index?: number }) {
  const isReserved = listing.status === "RESERVED"
  const isDistress = listing.isDistress
  const isRent = listing.listingType === "RENT"

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "card-animate group relative flex flex-col rounded-xl border bg-card p-4 transition-all duration-150 hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 active:scale-[0.98]",
        isDistress && "border-red-300 hover:border-red-400",
        isReserved && "opacity-70"
      )}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
    >
      {isDistress && (
        <div className="absolute -top-px left-4 right-4 h-0.5 rounded-full bg-red-400" />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{listing.projectName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{listing.location}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isRent && (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">For Rent</Badge>
          )}
          {isReserved && (
            <Badge variant="secondary" className="text-xs">Under Offer</Badge>
          )}
          {isDistress && (
            <Badge variant="destructive" className="text-xs">Distress Deal</Badge>
          )}

        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm mb-3">
        <span className="font-medium">{formatBeds(listing.bedrooms)}</span>
        <span className="text-muted-foreground capitalize">{listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()}</span>
        <span className="text-muted-foreground">{formatArea(listing.areaSqft, listing.areaSqm)}</span>
        {(listing.plotSqft || listing.plotSqm) && (
          <span className="text-muted-foreground">
            Plot {formatArea(listing.plotSqft, listing.plotSqm)}
          </span>
        )}
        {listing.floor && (
          <span className="text-muted-foreground capitalize">{listing.floor.toLowerCase()} floor</span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between">
        <p className="text-base font-bold tracking-tight">
          {listing.priceLabel ?? (isRent ? formatRentPrice(listing.price) : formatPrice(listing.price))}
        </p>
        <div className="flex flex-col items-end gap-1">
          {listing.handover && (
            <span className="text-xs text-muted-foreground">{listing.handover}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {daysAgo(new Date(listing.createdAt))}
          </span>
        </div>
      </div>
    </Link>
  )
}
