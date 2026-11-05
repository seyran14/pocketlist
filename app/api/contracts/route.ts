import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { CONTRACT_LINK_DAYS, contractUrl, newContractToken, sendContractEmail } from "@/lib/contracts"
import { storeGeneratedPdf } from "@/lib/documents"
import { createContractPdf } from "@/lib/tenancy-pdf"
import { ownerContractSchema } from "@/lib/tenancy-shared"
import { isPublicStatus } from "@/lib/utils"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  const { allowed } = checkRateLimit(`contracts:${userId}`, 20)
  if (!allowed) return NextResponse.json({ error: "Daily limit reached. Try again tomorrow." }, { status: 429 })

  const parsed = ownerContractSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: `${issue.path.join(".")}: ${issue.message}` }, { status: 422 })
  }
  const contract = parsed.data

  const listing = await prisma.listing.findUnique({
    where: { id: contract.listingId },
    select: { agentId: true, status: true, listingType: true, projectName: true },
  })
  if (!listing || listing.agentId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!isPublicStatus(listing.status) || listing.listingType !== "RENT") {
    return NextResponse.json({ error: "Only approved rental listings can have a contract." }, { status: 409 })
  }

  try {
    const createdAt = new Date()
    const { token, tokenHash } = newContractToken()
    const reference = tokenHash.slice(0, 10)
    const pdf = await createContractPdf(contract, reference, createdAt)
    const document = await storeGeneratedPdf(pdf, `tenancy-contract-${reference}.pdf`, userId)

    const created = await prisma.tenancyContract.create({
      data: {
        ownerId: userId,
        listingId: contract.listingId,
        documentId: document.id,
        tenantEmail: contract.tenantEmail,
        tenantName: contract.tenantName || null,
        tokenHash,
        linkExpiresAt: new Date(createdAt.getTime() + CONTRACT_LINK_DAYS * 24 * 60 * 60 * 1000),
      },
    })

    const url = contractUrl(token)
    const emailed = await sendContractEmail(contract.tenantEmail, "Your tenancy contract is ready to sign", {
      heading: "Your tenancy contract is ready to sign",
      body: `${contract.ownerName} prepared a tenancy contract for ${listing.projectName}. Read it, add your details and sign. The owner signs after you. The link works for ${CONTRACT_LINK_DAYS} days.`,
      url,
      action: "Review and sign",
    })

    logger.info("contract.created", { userId, contractId: created.id, emailed })
    return NextResponse.json({ id: created.id, url, emailed }, { status: 201 })
  } catch (err) {
    logger.error("contract.create_failed", err, { userId })
    return NextResponse.json({ error: "Failed to create the contract" }, { status: 500 })
  }
}
