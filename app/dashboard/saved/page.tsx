import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { Separator } from "@/components/ui/separator"
import { ListingCard } from "@/components/listings/ListingCard"
import { unsaveListingAction } from "@/lib/actions/saved"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SavedPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "BUYER") redirect("/dashboard")

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        select: {
          id: true,
          projectName: true,
          location: true,
          bedrooms: true,
          areaSqft: true,
          areaSqm: true,
          plotSqft: true,
          plotSqm: true,
          price: true,
          priceLabel: true,
          floor: true,
          status: true,
          listingType: true,
          isDistress: true,
          createdAt: true,
          handover: true,
          propertyType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const active = saved.filter((s) => s.listing.status !== "EXPIRED")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="card-animate flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Saved Listings</h1>
          <span className="text-sm text-muted-foreground">{active.length} saved</span>
        </div>
        <Separator className="mb-6" />

        {active.length === 0 ? (
          <div className="rounded-xl border bg-card py-20 text-center">
            <p className="text-muted-foreground text-sm mb-4">No saved listings yet.</p>
            <Link href="/">
              <Button variant="outline" size="sm">Browse listings</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((s) => (
              <div key={s.id} className="relative group/saved">
                <ListingCard
                  listing={{
                    ...s.listing,
                    createdAt: s.listing.createdAt.toISOString(),
                  }}
                />
                <form
                  action={async () => {
                    "use server"
                    await unsaveListingAction(s.id)
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover/saved:opacity-100 transition-opacity"
                >
                  <button
                    type="submit"
                    className="rounded-lg bg-background/90 border px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors backdrop-blur"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
