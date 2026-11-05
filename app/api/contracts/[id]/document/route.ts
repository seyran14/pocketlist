import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readDocument } from "@/lib/documents"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await ctx.params
  const contract = await prisma.tenancyContract.findUnique({ where: { id } })
  if (!session?.user || !contract || contract.ownerId !== session.user.id) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(new Uint8Array(await readDocument(contract.documentId)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="tenancy-contract.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
