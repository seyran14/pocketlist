import { NextRequest, NextResponse } from "next/server"
import { findContractByToken } from "@/lib/contracts"
import { readDocument } from "@/lib/documents"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const contract = await findContractByToken(token)
  const expired = contract?.status === "AWAITING_TENANT" && contract.linkExpiresAt < new Date()
  if (!contract || expired) return new NextResponse(null, { status: 404 })

  return new NextResponse(new Uint8Array(await readDocument(contract.documentId)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="tenancy-contract.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  })
}
