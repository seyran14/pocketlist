// Realistic rental listings for design review: real photo proportions, real Dubai
// areas, short and long names. Everything hangs off one owner account, so
// `npm run fixtures:remove` takes it all away again.
//
// Photos come from Unsplash (free to use under the Unsplash licence) and go
// through the same storePhoto pipeline as an owner's upload.
import { prisma } from "@/lib/prisma"
import { removePhotoFiles, storePhoto } from "@/lib/photos"

const OWNER_EMAIL = "fixtures@pocketlist.local"
const DAY = 86_400_000

type Shape = "portrait" | "landscape"
type Fixture = {
  title: string
  projectName: string
  location: string
  subLocation?: string
  propertyType: "APARTMENT" | "TOWNHOUSE" | "VILLA" | "PENTHOUSE"
  bedrooms: string
  bathrooms: string
  areaSqft: number
  price: number
  chequeCount: number
  furnished: "FURNISHED" | "UNFURNISHED" | "PARTIAL"
  floor?: "LOW" | "MIDDLE" | "HIGH"
  view?: string
  parkingSpots: number
  availableInDays?: number
  ageDays: number
  description: string
  photos: [string, Shape][]
}

const FIXTURES: Fixture[] = [
  {
    title: "Studio in Marina Gate 1",
    projectName: "Marina Gate 1",
    location: "Dubai Marina",
    propertyType: "APARTMENT",
    bedrooms: "Studio",
    bathrooms: "1",
    areaSqft: 489.36,
    price: 78_000,
    chequeCount: 4,
    furnished: "FURNISHED",
    floor: "HIGH",
    view: "Marina view",
    parkingSpots: 1,
    ageDays: 1,
    description: "Fully furnished studio on the 38th floor. Gym, pool and the tram stop are downstairs. DEWA and internet are not included.",
    photos: [["1586023492125-27b2c045efd7", "portrait"], ["1484154218962-a197022b5858", "landscape"], ["1631049307264-da0ec9d70304", "landscape"]],
  },
  {
    title: "1BR in Binghatti Gems",
    projectName: "Binghatti Gems",
    location: "Jumeirah Village Circle",
    subLocation: "District 12",
    propertyType: "APARTMENT",
    bedrooms: "1",
    bathrooms: "2",
    areaSqft: 759.29,
    price: 72_000,
    chequeCount: 2,
    furnished: "UNFURNISHED",
    floor: "MIDDLE",
    view: "Community view",
    parkingSpots: 1,
    availableInDays: 21,
    ageDays: 3,
    description: "Bright one-bedroom with a balcony and built-in wardrobes. Supermarket and nursery in the building.",
    photos: [["1493809842364-78817add7ffb", "landscape"], ["1560448204-e02f11c3d0e2", "landscape"], ["1615874959474-d609969a20ed", "portrait"]],
  },
  {
    title: "2BR in Burj Vista Tower 1",
    projectName: "Burj Vista Tower 1",
    location: "Downtown Dubai",
    propertyType: "APARTMENT",
    bedrooms: "2",
    bathrooms: "3",
    areaSqft: 1384,
    price: 210_000,
    chequeCount: 4,
    furnished: "PARTIAL",
    floor: "HIGH",
    view: "Burj Khalifa view",
    parkingSpots: 2,
    ageDays: 6,
    description: "Corner unit with a full Burj Khalifa view from the living room and both bedrooms. Kitchen appliances stay.",
    photos: [["1600607687939-ce8a6c25118c", "landscape"], ["1618221195710-dd6b41faaea6", "landscape"], ["1617806118233-18e1de247200", "portrait"], ["1616594039964-ae9021a400a0", "portrait"]],
  },
  {
    title: "1BR in Executive Towers",
    projectName: "Executive Towers B",
    location: "Business Bay",
    propertyType: "APARTMENT",
    bedrooms: "1",
    bathrooms: "1",
    areaSqft: 812.5,
    price: 95_000,
    chequeCount: 6,
    furnished: "FURNISHED",
    floor: "LOW",
    view: "Canal view",
    parkingSpots: 1,
    ageDays: 9,
    description: "Five minutes on foot to Bay Avenue and the metro. Cheques can be split into six.",
    photos: [["1502672260266-1c1ef2d93688", "portrait"], ["1522708323590-d24dbb6b0267", "landscape"], ["1505691938895-1758d7feb511", "landscape"]],
  },
  {
    title: "3BR townhouse in Rosa",
    projectName: "Rosa, Arabian Ranches 2",
    location: "Arabian Ranches 2",
    propertyType: "TOWNHOUSE",
    bedrooms: "3",
    bathrooms: "4",
    areaSqft: 2368,
    price: 185_000,
    chequeCount: 2,
    furnished: "UNFURNISHED",
    parkingSpots: 2,
    availableInDays: 45,
    ageDays: 12,
    description: "End unit backing onto the park, with a maid's room and a private garden. Community pool two minutes away.",
    photos: [["1600210492486-724fe5c67fb0", "landscape"], ["1554995207-c18c203602cb", "landscape"], ["1600566753190-17f0baa2a6c3", "portrait"], ["1616594039964-ae9021a400a0", "landscape"]],
  },
  {
    title: "4BR villa in Sidra 3",
    projectName: "Sidra 3",
    location: "Dubai Hills Estate",
    propertyType: "VILLA",
    bedrooms: "4",
    bathrooms: "5",
    areaSqft: 3725.8,
    price: 420_000,
    chequeCount: 1,
    furnished: "UNFURNISHED",
    view: "Park view",
    parkingSpots: 2,
    ageDays: 15,
    description: "Upgraded kitchen, landscaped garden with a private pool. Close to Dubai Hills Mall and King's School.",
    photos: [["1580587771525-78b9dba3b914", "landscape"], ["1600607687939-ce8a6c25118c", "landscape"], ["1617806118233-18e1de247200", "landscape"], ["1631049307264-da0ec9d70304", "portrait"]],
  },
  {
    title: "2BR in Al Barsha Heights",
    projectName: "Al Fahad Tower 2, Barsha Heights (Tecom)",
    location: "Al Barsha",
    subLocation: "Barsha Heights",
    propertyType: "APARTMENT",
    bedrooms: "2",
    bathrooms: "2",
    areaSqft: 1150,
    price: 105_000,
    chequeCount: 4,
    furnished: "UNFURNISHED",
    floor: "MIDDLE",
    view: "Sheikh Zayed Road view",
    parkingSpots: 1,
    ageDays: 20,
    description: "Spacious two-bedroom next to Dubai Internet City metro. Chiller is free.",
    photos: [["1594026112284-02bb6f3352fe", "portrait"], ["1484154218962-a197022b5858", "landscape"], ["1615874959474-d609969a20ed", "landscape"]],
  },
  {
    title: "5BR signature villa on Frond K",
    projectName: "Signature Villas, Frond K",
    location: "Palm Jumeirah",
    propertyType: "VILLA",
    bedrooms: "5",
    bathrooms: "6",
    areaSqft: 7012,
    price: 1_250_000,
    chequeCount: 1,
    furnished: "FURNISHED",
    view: "Sea view",
    parkingSpots: 4,
    availableInDays: 60,
    ageDays: 27,
    description: "Beachfront villa with a private beach, a pool and a home cinema. Furniture by the owner's designer.",
    photos: [["1613490493576-7fde63acd811", "landscape"], ["1600596542815-ffad4c1539a9", "landscape"], ["1602343168117-bb8ffe3e2e9f", "landscape"], ["1618221195710-dd6b41faaea6", "portrait"]],
  },
]

async function fetchPhoto(id: string, shape: Shape) {
  const size = shape === "portrait" ? "w=1200&h=1600" : "w=1600&h=1200"
  const res = await fetch(`https://images.unsplash.com/photo-${id}?${size}&fit=crop&q=80&fm=jpg`)
  if (!res.ok) throw new Error(`Unsplash ${id}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function remove() {
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL }, select: { id: true } })
  if (!owner) return console.log("No fixtures to remove.")
  const photos = await prisma.listingPhoto.findMany({ where: { uploaderId: owner.id }, select: { id: true } })
  await prisma.listing.deleteMany({ where: { agentId: owner.id } })
  await prisma.user.delete({ where: { id: owner.id } })
  await removePhotoFiles(photos.map((p) => p.id))
  console.log(`Removed the fixture owner, their listings and ${photos.length} photos.`)
}

async function create() {
  await remove()
  const now = Date.now()
  const owner = await prisma.user.create({
    data: { email: OWNER_EMAIL, name: "Layla Haddad", role: "AGENT", phone: "+971501112233", whatsapp: "+971501112233", contactPref: "BOTH" },
  })

  for (const f of FIXTURES) {
    const createdAt = new Date(now - f.ageDays * DAY)
    const listing = await prisma.listing.create({
      data: {
        createdAt,
        expiresAt: new Date(createdAt.getTime() + 30 * DAY),
        status: "ACTIVE",
        listingType: "RENT",
        title: f.title,
        projectName: f.projectName,
        location: f.location,
        subLocation: f.subLocation,
        propertyType: f.propertyType,
        bedrooms: f.bedrooms,
        bathrooms: f.bathrooms,
        areaSqft: f.areaSqft,
        areaSqm: Math.round((f.areaSqft / 10.764) * 100) / 100,
        price: f.price,
        chequeCount: f.chequeCount,
        furnished: f.furnished,
        floor: f.floor,
        view: f.view,
        parkingSpots: f.parkingSpots,
        availableFrom: f.availableInDays ? new Date(now + f.availableInDays * DAY) : null,
        description: f.description,
        agentId: owner.id,
      },
    })

    for (const [position, [photoId, shape]] of f.photos.entries()) {
      const id = await storePhoto(await fetchPhoto(photoId, shape))
      await prisma.listingPhoto.create({ data: { id, position, uploaderId: owner.id, listingId: listing.id } })
    }
    console.log(`${listing.id}  ${f.title}`)
  }
}

const run = process.argv.includes("--remove") ? remove : create
run()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
