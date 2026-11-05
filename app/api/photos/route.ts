import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { InvalidPhotoError, removePhotoFiles, removeStaleUploads, storePhoto } from "@/lib/photos"
import { MAX_PHOTO_BYTES, MAX_PHOTO_MB } from "@/lib/photos-shared"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  logger.setUser(userId, session.user.email ?? undefined)

  const { allowed } = checkRateLimit(`photos:${userId}`, 200)
  if (!allowed) {
    logger.warn("ratelimit.photos", { userId })
    return NextResponse.json({ error: "Daily photo limit reached. Try again tomorrow." }, { status: 429 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: `Photo is larger than ${MAX_PHOTO_MB} MB.` }, { status: 413 })
  }

  let id: string
  try {
    id = await storePhoto(Buffer.from(await file.arrayBuffer()))
  } catch (err) {
    if (err instanceof InvalidPhotoError) {
      return NextResponse.json({ error: err.message }, { status: 415 })
    }
    logger.error("photo.store_failed", err, { userId })
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }

  try {
    await prisma.listingPhoto.create({ data: { id, uploaderId: userId } })
  } catch (err) {
    await removePhotoFiles([id])
    logger.error("photo.create_failed", err, { userId })
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }

  logger.info("photo.uploaded", { userId, photoId: id, bytes: file.size })
  removeStaleUploads(userId).catch((err) => logger.error("photo.cleanup_failed", err, { userId }))

  return NextResponse.json({ id }, { status: 201 })
}
