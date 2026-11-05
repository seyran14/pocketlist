import { spawn } from "child_process"
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "crypto"
import { mkdir, readFile, unlink, writeFile } from "fs/promises"
import { join } from "path"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { encodeDocumentImage, InvalidPhotoError } from "@/lib/photos"
import { parseDeed, type DeedFields } from "@/lib/deed-shared"
import type { DocumentKind } from "@/lib/documents-shared"

// Passports and deeds, so never under UPLOAD_DIR, which is served publicly.
const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR ?? join(process.cwd(), "private-docs")
const READ_SCRIPT = join(process.cwd(), "scripts", "read-document.mjs")
const READ_TIMEOUT_MS = 30_000
const STALE_DEED_MS = 24 * 60 * 60 * 1000
const IV_BYTES = 12
const TAG_BYTES = 16
const MAX_NAME_LENGTH = 120

export const PDF = "application/pdf"
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function encryptionKey() {
  const key = Buffer.from(process.env.DOCUMENTS_KEY ?? "", "base64")
  if (key.length !== 32) throw new Error("DOCUMENTS_KEY must be 32 bytes, base64 encoded")
  return key
}

function encrypt(plain: Buffer) {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const body = Buffer.concat([cipher.update(plain), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), body])
}

function decrypt(stored: Buffer) {
  const iv = stored.subarray(0, IV_BYTES)
  const tag = stored.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(stored.subarray(IV_BYTES + TAG_BYTES)), decipher.final()])
}

const documentPath = (id: string) => join(DOCUMENTS_DIR, `${id}.enc`)

async function normalize(input: Buffer, kind: DocumentKind) {
  if (input.subarray(0, 5).toString("latin1") === "%PDF-") return { bytes: input, mimeType: PDF }

  const isZip = input[0] === 0x50 && input[1] === 0x4b
  if (isZip) {
    if (kind === "TITLE_DEED" && input.includes("word/document.xml")) return { bytes: input, mimeType: DOCX }
    throw new InvalidPhotoError("This file format isn't supported. Use a PDF or a photo.")
  }

  return { bytes: await encodeDocumentImage(input), mimeType: "image/webp" }
}

export function extractText(bytes: Buffer, mimeType: string) {
  if (mimeType !== PDF && mimeType !== DOCX) return Promise.resolve("")

  return new Promise<string>((resolve) => {
    const child = spawn(process.execPath, [READ_SCRIPT, mimeType === PDF ? "pdf" : "docx"], {
      stdio: ["pipe", "pipe", "inherit"],
      timeout: READ_TIMEOUT_MS,
    })
    const chunks: Buffer[] = []
    child.stdout.on("data", (chunk) => chunks.push(chunk))
    child.stdin.on("error", () => {})
    child.on("error", () => resolve(""))
    // An unreadable document isn't an error: it just goes to the reviewer unmatched.
    child.on("close", (code) => resolve(code === 0 ? Buffer.concat(chunks).toString("utf8") : ""))
    child.stdin.end(bytes)
  })
}

export async function storeDocument(input: Buffer, fileName: string, kind: DocumentKind, userId: string) {
  const { bytes, mimeType } = await normalize(input, kind)

  let text = ""
  let fields: DeedFields | null = null
  if (kind === "TITLE_DEED") {
    text = await extractText(bytes, mimeType)
    if (text.trim()) fields = parseDeed(text)
  }

  const id = randomUUID().replaceAll("-", "")
  await mkdir(DOCUMENTS_DIR, { recursive: true, mode: 0o700 })
  await writeFile(documentPath(id), encrypt(bytes), { mode: 0o600 })

  try {
    await prisma.ownerDocument.create({
      data: {
        id,
        kind,
        mimeType,
        fileName: fileName.slice(0, MAX_NAME_LENGTH),
        sha256: createHash("sha256").update(input).digest("hex"),
        deedNumber: fields?.deedNumber ?? null,
        uploaderId: userId,
      },
    })
  } catch (err) {
    await unlink(documentPath(id)).catch(() => {})
    throw err
  }

  if (kind !== "TITLE_DEED") {
    await deleteDocuments({ uploaderId: userId, kind, id: { not: id } })
  }
  return { id, mimeType, fields, hasText: !!text.trim() }
}

// For files the site generates, which need none of the checks on an upload.
export async function storeGeneratedPdf(bytes: Uint8Array, fileName: string, userId: string) {
  const id = randomUUID().replaceAll("-", "")
  const buffer = Buffer.from(bytes)
  await mkdir(DOCUMENTS_DIR, { recursive: true, mode: 0o700 })
  await writeFile(documentPath(id), encrypt(buffer), { mode: 0o600 })
  const sha256 = createHash("sha256").update(buffer).digest("hex")
  await prisma.ownerDocument.create({
    data: { id, kind: "TENANCY_CONTRACT", mimeType: PDF, fileName, sha256, uploaderId: userId },
  })
  return { id, sha256 }
}

export async function readDocument(id: string) {
  return decrypt(await readFile(documentPath(id)))
}

type DocumentFilter = NonNullable<Parameters<typeof prisma.ownerDocument.findMany>[0]>["where"]

export async function deleteDocuments(where: DocumentFilter) {
  const documents = await prisma.ownerDocument.findMany({ where, select: { id: true } })
  const ids = documents.map((d) => d.id)
  await prisma.ownerDocument.deleteMany({ where: { id: { in: ids } } })
  await Promise.all(
    ids.map((id) =>
      unlink(documentPath(id)).catch((err) => {
        if (err.code !== "ENOENT") logger.error("document.unlink_failed", err, { documentId: id })
      })
    )
  )
}

// Deeds uploaded for a listing that was never submitted.
export async function removeStaleDeeds(userId: string) {
  await deleteDocuments({
    uploaderId: userId,
    kind: "TITLE_DEED",
    listingId: null,
    createdAt: { lt: new Date(Date.now() - STALE_DEED_MS) },
  })
}

export async function attachDeed(listingId: string, userId: string, deedId: string) {
  const deed = await prisma.ownerDocument.findFirst({
    where: { id: deedId, uploaderId: userId, kind: "TITLE_DEED", OR: [{ listingId: null }, { listingId }] },
    select: { id: true },
  })
  if (!deed) return false

  await deleteDocuments({ listingId, kind: "TITLE_DEED", id: { not: deedId } })
  await prisma.ownerDocument.update({ where: { id: deedId }, data: { listingId } })
  return true
}
