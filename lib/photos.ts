import { randomUUID } from "crypto"
import { mkdir, readFile, unlink, writeFile } from "fs/promises"
import { join } from "path"
import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { MAX_PHOTOS_PER_LISTING } from "@/lib/photos-shared"

// Outside public/ because Next only serves files that existed at build time,
// and outside .next/ because every deploy wipes it.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")
const STALE_UPLOAD_MS = 24 * 60 * 60 * 1000

const FILE_NAME = /^[a-f0-9]{32}(-thumb)?\.webp$/

export class InvalidPhotoError extends Error {}

function isSupportedImage(b: Buffer) {
  const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  const isPng = b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  const isWebp =
    b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP"
  return isJpeg || isPng || isWebp
}

// Re-encoding drops EXIF, so GPS coordinates in phone photos never reach the site.
export async function storePhoto(input: Buffer): Promise<string> {
  if (!isSupportedImage(input)) {
    throw new InvalidPhotoError("Use a JPG, PNG or WebP image.")
  }

  const image = sharp(input, { failOn: "error", limitInputPixels: 100_000_000 }).rotate()
  let full: Buffer
  let thumb: Buffer
  try {
    ;[full, thumb] = await Promise.all([
      image.clone().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      image.clone().resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
    ])
  } catch {
    throw new InvalidPhotoError("This image is damaged or too large.")
  }

  const id = randomUUID().replaceAll("-", "")
  await mkdir(UPLOAD_DIR, { recursive: true })
  await Promise.all([
    writeFile(join(UPLOAD_DIR, `${id}.webp`), full),
    writeFile(join(UPLOAD_DIR, `${id}-thumb.webp`), thumb),
  ])
  return id
}

export async function readPhotoFile(fileName: string): Promise<Buffer | null> {
  if (!FILE_NAME.test(fileName)) return null
  return readFile(join(UPLOAD_DIR, fileName)).catch(() => null)
}

export async function removePhotoFiles(ids: string[]) {
  await Promise.all(
    ids.flatMap((id) =>
      [`${id}.webp`, `${id}-thumb.webp`].map((name) =>
        unlink(join(UPLOAD_DIR, name)).catch((err) => {
          if (err.code !== "ENOENT") logger.error("photo.unlink_failed", err, { photoId: id })
        })
      )
    )
  )
}

// Makes the listing's photos exactly `photoIds`, in that order. Only the caller's
// own photos that are unattached or already on this listing can be claimed.
export async function setListingPhotos(listingId: string, userId: string, photoIds: unknown) {
  if (!Array.isArray(photoIds)) return

  const requested = [...new Set(photoIds.filter((id): id is string => typeof id === "string"))]
  const claimable = await prisma.listingPhoto.findMany({
    where: {
      id: { in: requested },
      uploaderId: userId,
      OR: [{ listingId: null }, { listingId }],
    },
    select: { id: true },
  })
  const claimableIds = new Set(claimable.map((p) => p.id))
  const keep = requested.filter((id) => claimableIds.has(id)).slice(0, MAX_PHOTOS_PER_LISTING)

  const dropped = await prisma.listingPhoto.findMany({
    where: { listingId, id: { notIn: keep } },
    select: { id: true },
  })
  const droppedIds = dropped.map((p) => p.id)

  await prisma.$transaction([
    prisma.listingPhoto.deleteMany({ where: { id: { in: droppedIds } } }),
    ...keep.map((id, position) =>
      prisma.listingPhoto.update({ where: { id }, data: { listingId, position } })
    ),
  ])
  await removePhotoFiles(droppedIds)
}

export async function deletePhotos(where: { listingId: string } | { uploaderId: string }) {
  const photos = await prisma.listingPhoto.findMany({ where, select: { id: true } })
  const ids = photos.map((p) => p.id)
  await prisma.listingPhoto.deleteMany({ where: { id: { in: ids } } })
  await removePhotoFiles(ids)
}

// Uploads abandoned before publishing. Runs on upload rather than from cron so it
// doesn't depend on server crontab state.
export async function removeStaleUploads(userId: string) {
  const stale = await prisma.listingPhoto.findMany({
    where: {
      uploaderId: userId,
      listingId: null,
      createdAt: { lt: new Date(Date.now() - STALE_UPLOAD_MS) },
    },
    select: { id: true },
  })
  if (stale.length === 0) return
  const ids = stale.map((p) => p.id)
  await prisma.listingPhoto.deleteMany({ where: { id: { in: ids } } })
  await removePhotoFiles(ids)
}
