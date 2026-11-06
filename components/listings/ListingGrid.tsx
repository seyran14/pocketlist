import { getT } from "@/lib/i18n/server"
import { ListingCard } from "./ListingCard"
import { Skeleton } from "@/components/ui/skeleton"

type ListingCardData = React.ComponentProps<typeof ListingCard>["listing"]

export const LISTING_GRID = "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"

export async function ListingGrid({ listings, savedIds }: { listings: ListingCardData[]; savedIds?: Set<string> }) {
  const t = await getT()
  if (listings.length === 0) {
    return (
      <div className="col-span-full py-20 text-center text-muted-foreground">
        {t("No listings match your filters.")}
      </div>
    )
  }

  return (
    <div className={LISTING_GRID}>
      {listings.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} index={i} saved={savedIds?.has(listing.id)} />
      ))}
    </div>
  )
}

export function ListingGridSkeleton() {
  return (
    <div className={LISTING_GRID}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}
