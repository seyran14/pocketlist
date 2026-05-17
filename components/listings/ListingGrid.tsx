import { ListingCard } from "./ListingCard"
import { Skeleton } from "@/components/ui/skeleton"

type ListingCardData = React.ComponentProps<typeof ListingCard>["listing"]

export function ListingGrid({ listings }: { listings: ListingCardData[] }) {
  if (listings.length === 0) {
    return (
      <div className="col-span-full py-20 text-center text-muted-foreground">
        No listings match your filters.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} index={i} />
      ))}
    </div>
  )
}

export function ListingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-5 w-1/3 mt-4" />
        </div>
      ))}
    </div>
  )
}
