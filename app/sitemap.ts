import { prisma } from "@/lib/prisma"

const BASE = "https://pocketlist.ae"

export default async function sitemap() {
  const [listings, agents] = await Promise.all([
    prisma.listing.findMany({
      where: { status: { in: ["ACTIVE", "RESERVED"] } },
      select: { id: true, updatedAt: true },
    }),
    prisma.user.findMany({
      where: { role: "AGENT", listings: { some: { status: { in: ["ACTIVE", "RESERVED"] } } } },
      select: { id: true },
    }),
  ])

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 1 },
    { url: `${BASE}/agents`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    ...listings.map((l) => ({
      url: `${BASE}/listings/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...agents.map((a) => ({
      url: `${BASE}/agents/${a.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
