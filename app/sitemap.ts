import { prisma } from "@/lib/prisma"

const BASE = "https://pocketlist.ae"

export default async function sitemap() {
  const [listings, owners] = await Promise.all([
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
    { url: `${BASE}/owners`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    ...["/guide", "/about", "/contact", "/terms", "/privacy"].map((path) => ({
      url: `${BASE}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...listings.map((l) => ({
      url: `${BASE}/listings/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...owners.map((o) => ({
      url: `${BASE}/owners/${o.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
