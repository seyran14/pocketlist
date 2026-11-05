import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { sendContractEmail } from "@/lib/contracts"
import { deleteDocuments, readDocument, storeGeneratedPdf } from "@/lib/documents"
import { addOwnerSignature } from "@/lib/tenancy-pdf"
import { ownerSignatureSchema } from "@/lib/tenancy-shared"

const EJARI_NOTE = "Both parties have signed, and the contract is attached. It takes effect once it's registered on Ejari."

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const contract = await prisma.tenancyContract.findUnique({ where: { id } })
  if (!contract || contract.ownerId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (contract.status !== "AWAITING_OWNER") return NextResponse.json({ error: "This contract can't be signed now." }, { status: 409 })

  const parsed = ownerSignatureSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Add your signature." }, { status: 422 })

  try {
    const signedAt = new Date()
    const pdf = Buffer.from(await addOwnerSignature(await readDocument(contract.documentId), parsed.data.signature, signedAt))
    const document = await storeGeneratedPdf(pdf, "tenancy-contract-signed.pdf", contract.ownerId)

    // The status condition makes a double submit lose here rather than sign twice.
    const { count } = await prisma.tenancyContract.updateMany({
      where: { id, status: "AWAITING_OWNER" },
      data: { status: "COMPLETED", documentId: document.id, pdfSha256: document.sha256, ownerSignedAt: signedAt },
    })
    if (count === 0) {
      await deleteDocuments({ id: document.id })
      return NextResponse.json({ error: "Already signed" }, { status: 409 })
    }
    await deleteDocuments({ id: contract.documentId })

    const subject = "Your tenancy contract is signed"
    await sendContractEmail(contract.tenantEmail, subject, {
      heading: subject,
      body: `${EJARI_NOTE} You can register it on Ejari yourself.`,
    }, pdf)
    if (session.user.email) {
      await sendContractEmail(session.user.email, subject, {
        heading: subject,
        body: `${EJARI_NOTE} The tenant can register it on Ejari.`,
      }, pdf)
    }

    logger.info("contract.completed", { userId: session.user.id, contractId: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("contract.owner_sign_failed", err, { contractId: id })
    return NextResponse.json({ error: "Failed to sign the contract" }, { status: 500 })
  }
}
