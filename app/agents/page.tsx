import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export const metadata = { title: "Agents | PocketList" }

export default async function AgentsPage() {
  const agents = await prisma.user.findMany({
    where: {
      role: "AGENT",
      listings: { some: { status: { in: ["ACTIVE", "RESERVED"] } } },
    },
    select: {
      id: true,
      name: true,
      reraNumber: true,
      _count: { select: { listings: { where: { status: { in: ["ACTIVE", "RESERVED"] } } } } },
    },
    orderBy: { listings: { _count: "desc" } },
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Agents</h1>
        <p className="text-sm text-muted-foreground mb-5">
          {agents.length} agent{agents.length !== 1 ? "s" : ""} with active listings
        </p>
        <Separator className="mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a) => (
            <Link
              key={a.id}
              href={`/agents/${a.id}`}
              className="rounded-xl border bg-card p-4 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{a.name ?? "Agent"}</p>
                  {a.reraNumber && (
                    <p className="text-xs text-muted-foreground mt-0.5">RERA: {a.reraNumber}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {a._count.listings} listing{a._count.listings !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
