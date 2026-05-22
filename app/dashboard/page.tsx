import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { AgentDashboard } from "@/components/dashboard/AgentDashboard"
import { NotificationBanner } from "@/components/dashboard/NotificationBanner"
import { ProfileBanner } from "@/components/dashboard/ProfileBanner"
import { Separator } from "@/components/ui/separator"

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

        <ProfileBanner hasName={!!session.user.name} />

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
