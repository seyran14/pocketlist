import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { Separator } from "@/components/ui/separator"
import { AdminGate } from "./_components/AdminGate"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (session.user.email !== process.env.ADMIN_EMAIL) redirect("/")

  const jar = await cookies()
  const sp = await searchParams

  if (jar.get("admin_verified")?.value !== "1") {
    return <AdminGate error={sp.error === "1"} />
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    agents,
    buyers,
    totalListings,
    activeListings,
    newThisWeek,
    newUsers,
    recentListings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.listing.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        projectName: true,
        location: true,
        status: true,
        createdAt: true,
        agent: { select: { name: true } },
      },
    }),
  ])

  const stats: { label: string; value: number }[] = [
    { label: "Total Users", value: totalUsers },
    { label: "Agents", value: agents },
    { label: "Active Listings", value: activeListings },
    { label: "New This Week", value: newThisWeek },
    { label: "Buyers", value: buyers },
    { label: "Total Listings", value: totalListings },
    { label: "New Users", value: newUsers },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="card-animate flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">PocketList overview</p>
          </div>
        </div>
        <Separator className="mb-6" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 card-animate"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="card-animate rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Recent Listings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Agent</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Posted</th>
                </tr>
              </thead>
              <tbody>
                {recentListings.map((listing) => (
                  <tr key={listing.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium truncate max-w-[140px]">
                      {listing.projectName}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[120px]">
                      {listing.location}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {listing.agent.name ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          listing.status === "ACTIVE"
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }
                      >
                        {listing.status.charAt(0) + listing.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {listing.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {recentListings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No listings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
