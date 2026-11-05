import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MAX_LISTINGS_PER_USER } from "@/lib/utils"
import { NewListingClient } from "./NewListingClient"

export default async function NewListingPage() {
  const t = await getT()
  const session = await auth()
  const owned = session?.user
    ? await prisma.listing.count({ where: { agentId: session.user.id } })
    : 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {owned >= MAX_LISTINGS_PER_USER ? (
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold">{t("You've reached the limit of {n} listings", { n: MAX_LISTINGS_PER_USER })}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Sold and expired listings count too. Delete one to add another.")}
          </p>
          <Link href="/dashboard" className="mt-6 inline-block">
            <Button>{t("Go to my listings")}</Button>
          </Link>
        </main>
      ) : (
        <NewListingClient />
      )}
    </div>
  )
}
