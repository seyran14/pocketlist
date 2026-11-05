import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { auth } from "@/lib/auth"
import { parseDeed } from "@/lib/deed-shared"
import { extractText, readDocument } from "@/lib/documents"
import { prisma } from "@/lib/prisma"
import { isPublicStatus } from "@/lib/utils"
import { ContractClient } from "./ContractClient"

async function readDeed(listingId: string) {
  const deed = await prisma.ownerDocument.findFirst({ where: { listingId, kind: "TITLE_DEED" } })
  if (!deed) return parseDeed("")
  const text = await extractText(await readDocument(deed.id), deed.mimeType).catch(() => "")
  return parseDeed(text)
}

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      review: true,
      agent: { select: { name: true, email: true, phone: true } },
      contracts: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!listing || listing.agentId !== session.user.id) notFound()

  const eligible = listing.listingType === "RENT" && isPublicStatus(listing.status)
  const deed = await readDeed(id)
  const sqm = listing.areaSqm ?? deed.areaSqm

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ContractClient
        listingId={id}
        eligible={eligible}
        contracts={listing.contracts.map((c) => ({
          id: c.id,
          status: c.status,
          tenantEmail: c.tenantEmail,
          tenantName: c.tenantName,
          createdAt: c.createdAt.toISOString(),
        }))}
        defaults={{
          ownerName: listing.agent.name ?? "",
          ownerEmail: listing.agent.email,
          ownerPhone: listing.agent.phone ?? "",
          plotNumber: deed.plotNumber ?? "",
          buildingName: deed.buildingName ?? listing.projectName,
          propertyNumber: listing.review?.propertyNumber ?? deed.propertyNumber ?? "",
          propertyType: listing.bedrooms === "Studio" ? "Studio" : `${listing.bedrooms} Bedroom`,
          areaSqm: sqm ? String(sqm) : "",
          location: deed.community ?? listing.location,
          annualRent: listing.price,
          cheques: listing.chequeCount ?? 1,
        }}
      />
    </div>
  )
}
