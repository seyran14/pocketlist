import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { findContractByToken, sendContractEmail } from "@/lib/contracts"
import { deleteDocuments, readDocument, storeGeneratedPdf } from "@/lib/documents"
import { addTenantToPdf } from "@/lib/tenancy-pdf"
import { tenantContractSchema } from "@/lib/tenancy-shared"
import { clientIp } from "@/lib/request-ip"

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const ip = clientIp(req.headers)
  const { allowed } = checkRateLimit(`contract-sign:${ip}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })

  const { token } = await ctx.params
  const contract = await findContractByToken(token)
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (contract.status !== "AWAITING_TENANT") return NextResponse.json({ error: "Already signed" }, { status: 409 })
  if (contract.linkExpiresAt < new Date()) return NextResponse.json({ error: "This link has expired." }, { status: 410 })

  const parsed = tenantContractSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: `${issue.path.join(".")}: ${issue.message}` }, { status: 422 })
  }

  try {
    const signedAt = new Date()
    const pdf = await addTenantToPdf(await readDocument(contract.documentId), parsed.data, signedAt)
    const document = await storeGeneratedPdf(pdf, "tenancy-contract-signed.pdf", contract.ownerId)

    // The status condition makes a double submit lose here rather than sign twice.
    const { count } = await prisma.tenancyContract.updateMany({
      where: { id: contract.id, status: "AWAITING_TENANT" },
      data: {
        status: "AWAITING_OWNER",
        documentId: document.id,
        tenantName: parsed.data.tenantName,
        tenantSignedAt: signedAt,
        tenantIp: ip,
      },
    })
    if (count === 0) {
      await deleteDocuments({ id: document.id })
      return NextResponse.json({ error: "Already signed" }, { status: 409 })
    }
    await deleteDocuments({ id: contract.documentId })

    const owner = await prisma.user.findUnique({ where: { id: contract.ownerId }, select: { email: true } })
    await prisma.notification.create({
      data: {
        userId: contract.ownerId,
        listingId: contract.listingId,
        type: "CONTRACT_SIGNED",
        message: `${parsed.data.tenantName} signed the tenancy contract. Check it and add your signature.`,
      },
    })
    if (owner) {
      await sendContractEmail(owner.email, "The tenant signed. Your signature is next", {
        heading: "The tenant signed your contract",
        body: `${parsed.data.tenantName} added their details and signed. Check that everything is right, then add your signature. Both of you will get the finished contract by email.`,
        url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://pocketlist.ae"}/dashboard/listings/${contract.listingId}/contract`,
        action: "Review and sign",
      })
    }

    logger.info("contract.tenant_signed", { contractId: contract.id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("contract.sign_failed", err, { contractId: contract.id })
    return NextResponse.json({ error: "Failed to sign the contract" }, { status: 500 })
  }
}
