import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminListingRow } from "./AdminListingRow"

export const metadata = { title: "Admin" }

const PAGE_SIZE = 200

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await isAdminSession())) redirect("/admin")

  const q = (await searchParams).q?.trim() ?? ""
  const where = q
    ? { OR: [{ projectName: { contains: q } }, { location: { contains: q } }, { agent: { email: { contains: q } } }] }
    : undefined

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        projectName: true,
        location: true,
        status: true,
        priceLabel: true,
        agent: { select: { name: true, email: true } },
      },
    }),
  ])

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main id="main" className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Back to admin</Link>
          <h1 className="mt-2 text-2xl font-bold">All listings ({total})</h1>
        </div>

        <form className="flex gap-2">
          <Input name="q" defaultValue={q} placeholder="Building, location or owner's email" aria-label="Search listings" />
          <Button type="submit" variant="outline">Search</Button>
        </form>

        {listings.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">No listings found.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {listings.map((listing) => <AdminListingRow key={listing.id} listing={listing} />)}
          </ul>
        )}
        {total > listings.length && (
          <p className="text-sm text-muted-foreground">Showing the newest {PAGE_SIZE}. Search to find the rest.</p>
        )}
      </main>
    </div>
  )
}
