import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { AgentDashboard } from "@/components/dashboard/AgentDashboard"
import { NotificationBanner } from "@/components/dashboard/NotificationBanner"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (session.user.role === "BUYER") {
    redirect("/dashboard/saved")
  }

  // Agent dashboard
  const now = new Date()

  const [listings, expiringListings] = await Promise.all([
    prisma.listing.findMany({
      where: { agentId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectName: true,
        location: true,
        bedrooms: true,
        price: true,
        priceLabel: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        viewCount: true,
      },
    }),
    prisma.listing.findMany({
      where: {
        agentId: session.user.id,
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      select: { id: true, projectName: true, location: true, createdAt: true, expiresAt: true },
      orderBy: { expiresAt: "asc" },
    }),
  ])

  const serializedListings = listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt.toISOString(),
  }))

  const serializedExpiring = expiringListings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="card-animate flex items-center justify-between mb-1" style={{ animationDelay: "0ms" }}>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{listings.length} total</span>
            {listings.filter((l) => l.status === "ACTIVE").length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {listings.filter((l) => l.status === "ACTIVE").length} active
              </span>
            )}
            {listings.filter((l) => l.status === "RESERVED").length > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {listings.filter((l) => l.status === "RESERVED").length} under offer
              </span>
            )}
            {listings.filter((l) => l.status === "SOLD").length > 0 && (
              <span>
                {listings.filter((l) => l.status === "SOLD").length} sold
              </span>
            )}
          </div>
        </div>
        <Separator className="mb-6" />

        {!session.user.name && (
          <div className="card-animate mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 flex items-center justify-between gap-4 text-sm" style={{ animationDelay: "60ms" }}>
            <span className="text-amber-800 dark:text-amber-300">
              Complete your profile so buyers can contact you.
            </span>
            <Link href="/profile">
              <Button size="sm" variant="outline" className="shrink-0 h-7 px-3 text-xs">
                Set up profile →
              </Button>
            </Link>
          </div>
        )}

        {expiringListings.length > 0 && (
          <div className="card-animate mb-6" style={{ animationDelay: "80ms" }}>
            <NotificationBanner listings={serializedExpiring} />
          </div>
        )}

        <div className="card-animate" style={{ animationDelay: "80ms" }}>
          <AgentDashboard listings={serializedListings} />
        </div>
      </main>
    </div>
  )
}
