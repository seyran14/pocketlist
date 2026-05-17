import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000)

async function main() {
  await prisma.user.deleteMany()
  await prisma.listing.deleteMany()

  const agent = await prisma.user.create({
    data: {
      email: "agent@dubailist.test",
      name: "Mohammed Al Rashid",
      role: "AGENT",
      phone: "+971501234567",
      whatsapp: "+971501234567",
      contactPref: "BOTH",
    },
  })

  await prisma.user.create({
    data: {
      email: "buyer@dubailist.test",
      name: "Sarah Johnson",
      role: "BUYER",
    },
  })

  const listings = [
    { projectName: "Peninsula 2", location: "Business Bay", bedrooms: "Studio", areaSqft: 388, price: 1_380_000, handover: "Q1 2026", view: "Canal", propertyType: "APARTMENT" },
    { projectName: "Peninsula 2", location: "Business Bay", bedrooms: "1", areaSqft: 720, price: 2_100_000, handover: "Q1 2026", view: "Canal", propertyType: "APARTMENT" },
    { projectName: "Creek Vistas Grande", location: "Sobha Hartland", bedrooms: "2", areaSqft: 1100, price: 3_200_000, handover: "Q4 2026", floor: "HIGH", propertyType: "APARTMENT" },
    { projectName: "Skyscape Aura", location: "Downtown Dubai", bedrooms: "1", areaSqft: 610, price: 1_950_000, handover: "Ready", view: "Burj Khalifa", propertyType: "APARTMENT" },
    { projectName: "Elara 3", location: "MBR City", bedrooms: "3", areaSqft: 1800, price: 4_500_000, handover: "Q2 2027", propertyType: "APARTMENT" },
    { projectName: "Naya 1", location: "MBR City", bedrooms: "2", areaSqft: 1250, price: 2_800_000, handover: "Q3 2027", floor: "MIDDLE", propertyType: "APARTMENT" },
    { projectName: "Crest Grande", location: "Sobha Hartland", bedrooms: "3", areaSqft: 1950, price: 5_200_000, handover: "Ready", view: "Creek", propertyType: "APARTMENT" },
    { projectName: "Address Harbour Point", location: "Dubai Creek Harbour", bedrooms: "1", areaSqft: 700, price: 1_750_000, handover: "Ready", view: "Creek Tower", propertyType: "APARTMENT" },
    { projectName: "Palm Jumeirah Villa", location: "Palm Jumeirah", bedrooms: "4", areaSqft: 5200, price: 18_000_000, handover: "Ready", view: "Sea", furnished: "FURNISHED", propertyType: "VILLA" },
    { projectName: "DAMAC Hills Townhouse", location: "DAMAC Hills", bedrooms: "3", areaSqft: 2100, price: 2_200_000, handover: "Ready", propertyType: "TOWNHOUSE" },
    { projectName: "Azizi Riviera", location: "MBR City", bedrooms: "Studio", areaSqft: 420, price: 750_000, handover: "Ready", propertyType: "APARTMENT" },
    { projectName: "Azizi Riviera", location: "MBR City", bedrooms: "1", areaSqft: 680, price: 1_100_000, handover: "Ready", propertyType: "APARTMENT" },
    { projectName: "Emaar Golf Heights", location: "Emirates Living", bedrooms: "2", areaSqft: 1350, price: 1_900_000, handover: "Ready", view: "Golf", propertyType: "APARTMENT" },
    { projectName: "Binghatti Nova", location: "JVC", bedrooms: "Studio", areaSqft: 380, price: 650_000, handover: "Q2 2025", propertyType: "APARTMENT" },
    { projectName: "Binghatti Nova", location: "JVC", bedrooms: "1", areaSqft: 730, price: 980_000, handover: "Q2 2025", propertyType: "APARTMENT" },
    { projectName: "One Za'abeel", location: "Za'abeel", bedrooms: "2", areaSqft: 1700, price: 8_500_000, handover: "Ready", view: "DIFC", floor: "HIGH", furnished: "FURNISHED", propertyType: "APARTMENT" },
    { projectName: "DT1 Penthouse", location: "Downtown Dubai", bedrooms: "4", areaSqft: 4500, price: 22_000_000, handover: "Ready", view: "Burj Khalifa", floor: "HIGH", propertyType: "PENTHOUSE" },
    { projectName: "Mag 5 Blvd", location: "Dubai South", bedrooms: "1", areaSqft: 590, price: 580_000, handover: "Ready", propertyType: "APARTMENT" },
    { projectName: "Seven City", location: "JLT", bedrooms: "Studio", areaSqft: 430, price: 620_000, handover: "Ready", propertyType: "APARTMENT" },
    { projectName: "Emaar Beachfront", location: "Dubai Harbour", bedrooms: "2", areaSqft: 1200, price: 3_800_000, handover: "Q4 2025", view: "Sea", propertyType: "APARTMENT", isDistress: true, originalPrice: 4_200_000 },
    { projectName: "Emaar Beachfront", location: "Dubai Harbour", bedrooms: "1", areaSqft: 750, price: 2_100_000, handover: "Q4 2025", view: "Sea", propertyType: "APARTMENT" },
    { projectName: "Meraas Bulgari Villa", location: "Jumeirah Bay Island", bedrooms: "5+", areaSqft: 12000, price: 85_000_000, handover: "Ready", view: "Sea", furnished: "FURNISHED", propertyType: "VILLA" },
    { projectName: "Danube Fashionz", location: "International City", bedrooms: "Studio", areaSqft: 350, price: 490_000, handover: "Q1 2026", propertyType: "APARTMENT" },
    { projectName: "Marina Gate", location: "Dubai Marina", bedrooms: "2", areaSqft: 1150, price: 2_400_000, handover: "Ready", view: "Marina", floor: "HIGH", propertyType: "APARTMENT" },
    { projectName: "Marina Gate", location: "Dubai Marina", bedrooms: "3", areaSqft: 1800, price: 3_700_000, handover: "Ready", view: "Sea", floor: "HIGH", propertyType: "APARTMENT" },
    { projectName: "Vida Residence", location: "The Hills", bedrooms: "1", areaSqft: 760, price: 1_350_000, handover: "Ready", propertyType: "APARTMENT" },
    { projectName: "The Opus", location: "Business Bay", bedrooms: "2", areaSqft: 1400, price: 4_100_000, handover: "Ready", view: "Burj Khalifa", floor: "HIGH", furnished: "FURNISHED", propertyType: "APARTMENT" },
    { projectName: "Murooj Al Furjan", location: "Al Furjan", bedrooms: "3", areaSqft: 2300, price: 2_700_000, handover: "Ready", propertyType: "TOWNHOUSE" },
    { projectName: "Bloom Heights", location: "JVC", bedrooms: "2", areaSqft: 1050, price: 1_100_000, handover: "Ready", propertyType: "APARTMENT", isDistress: true, originalPrice: 1_350_000 },
    { projectName: "Park Lane", location: "MBR City", bedrooms: "1", areaSqft: 660, price: 1_600_000, handover: "Q3 2026", propertyType: "APARTMENT" },
    { projectName: "Ellington Place", location: "Palm Jumeirah", bedrooms: "2", areaSqft: 1300, price: 5_500_000, handover: "Ready", view: "Sea", floor: "HIGH", propertyType: "APARTMENT" },
    { projectName: "AARK Residences", location: "Dubailand", bedrooms: "Studio", areaSqft: 400, price: 540_000, handover: "Q4 2025", propertyType: "APARTMENT" },
    { projectName: "Object 1 Lofts", location: "JLT", bedrooms: "1", areaSqft: 810, price: 1_050_000, handover: "Ready", propertyType: "APARTMENT" },
    { projectName: "Emaar Bayview", location: "Dubai Harbour", bedrooms: "3", areaSqft: 1750, price: 6_200_000, handover: "Q1 2027", view: "Sea", propertyType: "APARTMENT" },
    { projectName: "Cavalli Casa Tower", location: "Al Sufouh", bedrooms: "2", areaSqft: 1600, price: 4_800_000, handover: "Ready", view: "Sea", furnished: "PARTIAL", floor: "MIDDLE", propertyType: "APARTMENT" },
  ]

  const createdAts = [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 22, 24, 25, 26, 28, 31, 32, 33, 35, 1, 3, 6, 11, 19, 27, 2, 8, 14, 21, 4]

  for (let i = 0; i < listings.length; i++) {
    const l = listings[i] as {
      projectName: string
      location: string
      bedrooms: string
      areaSqft: number
      price: number
      handover?: string
      view?: string
      propertyType: string
      floor?: string
      furnished?: string
      isDistress?: boolean
      originalPrice?: number
    }
    const createdAt = daysAgo(createdAts[i] ?? 1)
    const beds = l.bedrooms === "Studio" ? "Studio" : `${l.bedrooms}BR`
    const priceK = Math.round(l.price / 1000)
    const priceLabel = `AED ${l.price.toLocaleString("en-AE")}`

    await prisma.listing.create({
      data: {
        agentId: agent.id,
        createdAt,
        expiresAt: daysFromNow(30 - (createdAts[i] ?? 1)),
        status: "ACTIVE",
        title: `${beds} in ${l.location} – AED ${priceK}K`,
        projectName: l.projectName,
        location: l.location,
        propertyType: l.propertyType as never,
        bedrooms: l.bedrooms,
        areaSqft: l.areaSqft,
        areaSqm: Math.round(l.areaSqft / 10.764),
        price: l.price,
        priceLabel,
        handover: l.handover ?? null,
        view: l.view ?? null,
        floor: (l.floor as never) ?? null,
        furnished: (l.furnished as never) ?? null,
        isDistress: l.isDistress ?? false,
        originalPrice: l.originalPrice ?? null,
      },
    })
  }

  console.log(`✓ Seeded 1 agent, 1 buyer, ${listings.length} listings`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
