import { spawn } from "child_process"
import { randomUUID } from "crypto"
import { mkdir, readFile, unlink, writeFile } from "fs/promises"
import { join } from "path"
import bmp from "bmp-js"
import sharp, { type Sharp } from "sharp"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { MAX_PHOTOS_PER_LISTING } from "@/lib/photos-shared"

// Outside public/ because Next only serves files that existed at build time,
// and outside .next/ because every deploy wipes it.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads")
const STALE_UPLOAD_MS = 24 * 60 * 60 * 1000
const MAX_INPUT_PIXELS = 100_000_000
const FULL_SIDE = 2000
const THUMB_SIDE = 960
const HEIC_SCRIPT = join(process.cwd(), "scripts", "heic-to-png.mjs")
const HEIC_TIMEOUT_MS = 60_000

// SVG stays out: sharp can read it, but it's markup rather than a photo.
const SHARP_FORMATS = new Set(["jpeg", "png", "webp", "tiff", "gif", "heif"])

const FILE_NAME = /^[a-f0-9]{32}(-thumb)?\.webp$/

const UNSUPPORTED_FORMAT = "This file format isn't supported. Try a JPG or PNG."

export class InvalidPhotoError extends Error {}

let heicQueue: Promise<unknown> = Promise.resolve()

function assertPixelLimit(width: number, height: number) {
  if (width * height > MAX_INPUT_PIXELS) throw new InvalidPhotoError("This image is too large.")
}

function convertHeic(input: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(process.execPath, [HEIC_SCRIPT, String(FULL_SIDE)], {
      stdio: ["pipe", "pipe", "inherit"],
      timeout: HEIC_TIMEOUT_MS,
    })
    const chunks: Buffer[] = []
    child.stdout.on("data", (chunk) => chunks.push(chunk))
    child.stdin.on("error", () => {}) // EPIPE if the decoder dies early; "close" reports it.
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks))
      else reject(new Error(`heic-to-png exited with ${code}`))
    })
    child.stdin.end(input)
  })
}

// sharp's prebuilt binaries can't decode HEVC, which is what iPhones save as HEIC.
// One at a time: a 48 MP HEIC takes about 650 MB while it decodes.
async function openHeic(input: Buffer, width: number, height: number) {
  assertPixelLimit(width, height)
  const png = heicQueue.then(() => convertHeic(input))
  heicQueue = png.catch(() => {})
  return sharp(await png)
}

// sharp doesn't read BMP at all. bmp-js returns ABGR, so it's repacked to RGB.
function openBmp(input: Buffer) {
  assertPixelLimit(input.readInt32LE(18), Math.abs(input.readInt32LE(22)))
  const { data, width, height } = bmp.decode(input)
  const rgb = Buffer.alloc(width * height * 3)
  for (let src = 0, dst = 0; src < data.length; src += 4, dst += 3) {
    rgb[dst] = data[src + 3]
    rgb[dst + 1] = data[src + 2]
    rgb[dst + 2] = data[src + 1]
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } })
}

async function openImage(input: Buffer): Promise<Sharp> {
  if (input[0] === 0x42 && input[1] === 0x4d) return openBmp(input)

  const options = { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS } as const
  const meta = await sharp(input, options).metadata()
  if (!SHARP_FORMATS.has(meta.format)) throw new InvalidPhotoError(UNSUPPORTED_FORMAT)
  if (meta.compression === "hevc") return openHeic(input, meta.width, meta.height)
  return sharp(input, options)
}

// Re-encoding drops EXIF, so GPS coordinates in phone photos never reach the site.
export async function storePhoto(input: Buffer): Promise<string> {
  let full: Buffer
  let thumb: Buffer
  try {
    const image = (await openImage(input)).rotate()
    ;[full, thumb] = await Promise.all([
      image.clone().resize(FULL_SIDE, FULL_SIDE, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
      image.clone().resize(THUMB_SIDE, THUMB_SIDE, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
    ])
  } catch (err) {
    if (err instanceof InvalidPhotoError) throw err
    // sharp reports anything it can't identify the same way as a broken file.
    throw new InvalidPhotoError("We couldn't read this file. It may be damaged or not a photo.")
  }

  const id = randomUUID().replaceAll("-", "")
  await mkdir(UPLOAD_DIR, { recursive: true })
  await Promise.all([
    writeFile(join(UPLOAD_DIR, `${id}.webp`), full),
    writeFile(join(UPLOAD_DIR, `${id}-thumb.webp`), thumb),
  ])
  return id
}

// Same re-encode as a photo: drops EXIF and makes HEIC viewable in a browser.
export async function encodeDocumentImage(input: Buffer) {
  try {
    const image = await openImage(input)
    return await image.rotate().resize(FULL_SIDE, FULL_SIDE, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
  } catch (err) {
    if (err instanceof InvalidPhotoError) throw err
    throw new InvalidPhotoError("We couldn't read this file. Use a PDF or a photo.")
  }
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
