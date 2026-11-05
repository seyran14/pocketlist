import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { removeStaleDeeds, storeDocument } from "@/lib/documents"
import { DOCUMENT_KINDS, type DocumentKind } from "@/lib/documents-shared"
import { InvalidPhotoError } from "@/lib/photos"
import { MAX_PHOTO_BYTES, MAX_PHOTO_MB } from "@/lib/photos-shared"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const documents = await prisma.ownerDocument.findMany({
    where: { uploaderId: session.user.id, kind: { in: ["PASSPORT", "EMIRATES_ID"] } },
    select: { id: true, kind: true, fileName: true },
  })
  return NextResponse.json({
    passport: documents.find((d) => d.kind === "PASSPORT") ?? null,
    emiratesId: documents.find((d) => d.kind === "EMIRATES_ID") ?? null,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  logger.setUser(userId, session.user.email ?? undefined)

  const { allowed } = checkRateLimit(`documents:${userId}`, 40)
  if (!allowed) {
    logger.warn("ratelimit.documents", { userId })
    return NextResponse.json({ error: "Daily upload limit reached. Try again tomorrow." }, { status: 429 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  const kind = form?.get("kind")
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (!DOCUMENT_KINDS.includes(kind as DocumentKind)) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 400 })
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: `File is larger than ${MAX_PHOTO_MB} MB.` }, { status: 413 })
  }

  try {
    const stored = await storeDocument(Buffer.from(await file.arrayBuffer()), file.name, kind as DocumentKind, userId)
    // The file name and contents stay out of the logs on purpose.
    logger.info("document.uploaded", { userId, documentId: stored.id, kind })
    removeStaleDeeds(userId).catch((err) => logger.error("document.cleanup_failed", err, { userId }))
    return NextResponse.json(
      { id: stored.id, fileName: file.name, fields: stored.fields, hasText: stored.hasText },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof InvalidPhotoError) return NextResponse.json({ error: err.message }, { status: 415 })
    logger.error("document.store_failed", err, { userId })
    return NextResponse.json({ error: "Failed to save the document" }, { status: 500 })
  }
}
