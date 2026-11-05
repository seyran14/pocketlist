import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { deleteDocuments } from "@/lib/documents"

// Withdraws a contract the tenant hasn't signed. A completed one can't be removed here.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const contract = await prisma.tenancyContract.findUnique({ where: { id } })
  if (!contract || contract.ownerId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (contract.status !== "AWAITING_TENANT") return NextResponse.json({ error: "Already signed" }, { status: 409 })

  await prisma.tenancyContract.delete({ where: { id } })
  await deleteDocuments({ id: contract.documentId })
  logger.info("contract.withdrawn", { userId: session.user.id, contractId: id })
  return new NextResponse(null, { status: 204 })
}
