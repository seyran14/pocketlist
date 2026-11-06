import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Which of these listings the visitor has saved. Undefined means the visitor
 * can't save at all, so cards show no heart. Signed-out visitors get an empty
 * set: their heart sends them to the login page.
 */
export async function getSavedIds(listingIds: string[]): Promise<Set<string> | undefined> {
  const session = await auth()
  if (!session?.user?.id) return new Set()
  if (session.user.role !== "BUYER") return undefined

  const rows = await prisma.savedListing.findMany({
    where: { userId: session.user.id, listingId: { in: listingIds } },
    select: { listingId: true },
  })
  return new Set(rows.map((r) => r.listingId))
}
