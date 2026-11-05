import { NextRequest, NextResponse } from "next/server"
import { isAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { DOCX, readDocument } from "@/lib/documents"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return new NextResponse(null, { status: 404 })

  const { id } = await ctx.params
  const document = await prisma.ownerDocument.findUnique({ where: { id } })
  if (!document) return new NextResponse(null, { status: 404 })

  try {
    const bytes = await readDocument(id)
    logger.info("document.viewed", { documentId: id, kind: document.kind })
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": document.mimeType === DOCX ? `attachment; filename="${id}.docx"` : "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (err) {
    logger.error("document.read_failed", err, { documentId: id })
    return new NextResponse(null, { status: 500 })
  }
}
