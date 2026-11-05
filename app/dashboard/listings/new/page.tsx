import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MAX_LISTINGS_PER_USER } from "@/lib/utils"
import { NewListingClient } from "./NewListingClient"

export default async function NewListingPage() {
  const session = await auth()
  const owned = session?.user
    ? await prisma.listing.count({ where: { agentId: session.user.id } })
    : 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {owned >= MAX_LISTINGS_PER_USER ? (
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold">You&apos;ve reached the limit of {MAX_LISTINGS_PER_USER} listings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sold and expired listings count too. Delete one to add another.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block">
            <Button>Go to my listings</Button>
          </Link>
        </main>
      ) : (
        <NewListingClient />
      )}
    </div>
  )
}
