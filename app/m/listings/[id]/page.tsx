import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { FeedClient } from "./FeedClient"

export default async function MobileFeedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [session, targetListing] = await Promise.all([
    auth(),
    prisma.listing.findUnique({
      where: { id },
      include: { agent: { select: { id: true, name: true } } },
    }),
  ])

  if (!targetListing || targetListing.status === "EXPIRED") notFound()

  const rest = await prisma.listing.findMany({
    where: {
      id: { not: id },
      status: { in: ["ACTIVE", "RESERVED"] },
    },
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { id: true, name: true } } },
  })

  const allListings = [targetListing, ...rest]

  const savedIds: string[] = session?.user?.id
    ? (
        await prisma.savedListing.findMany({
          where: {
            userId: session.user.id,
            listingId: { in: allListings.map((l) => l.id) },
          },
          select: { listingId: true },
        })
      ).map((s) => s.listingId)
    : []

  const serialized = allListings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    expiresAt: l.expiresAt.toISOString(),
    handoverDate: l.handoverDate?.toISOString() ?? null,
  }))

  return (
    <FeedClient
      listings={serialized}
      savedIds={savedIds}
      isLoggedIn={!!session?.user}
    />
  )
}
