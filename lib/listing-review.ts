import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { compareDeed, parseDeed, type DeedCheck } from "@/lib/deed-shared"
import { DOCX, extractText, readDocument } from "@/lib/documents"

async function reuseCheck(listingId: string, ownerId: string, deed: { sha256: string; deedNumber: string | null }) {
  const elsewhere = await prisma.ownerDocument.findFirst({
    where: {
      kind: "TITLE_DEED",
      listingId: { not: listingId },
      OR: [{ sha256: deed.sha256 }, ...(deed.deedNumber ? [{ deedNumber: deed.deedNumber }] : [])],
    },
    select: { listingId: true, uploaderId: true },
  })
  if (!elsewhere?.listingId) return null

  const byOtherOwner = elsewhere.uploaderId !== ownerId
  return {
    key: "reused",
    label: "Deed reuse",
    claimed: "–",
    found: `Also on listing ${elsewhere.listingId}${byOtherOwner ? ", by a different owner" : ""}`,
    result: byOtherOwner ? "mismatch" : "check",
  } satisfies DeedCheck
}

// Compares what the owner entered with their deed and stores the result for the reviewer.
export async function refreshChecks(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      review: true,
      agent: { select: { name: true } },
      documents: { where: { kind: "TITLE_DEED" }, take: 1 },
    },
  })
  const deed = listing?.documents[0]
  if (!listing?.review || !deed) return

  let text = ""
  try {
    text = await extractText(await readDocument(deed.id), deed.mimeType)
  } catch (err) {
    logger.error("document.read_failed", err, { documentId: deed.id })
  }

  const checks = compareDeed(
    { ...listing, ...listing.review, ownerName: listing.agent.name },
    parseDeed(text),
    text
  )

  const reused = await reuseCheck(listingId, listing.agentId, deed)
  if (reused) checks.unshift(reused)

  if (deed.mimeType === DOCX) {
    checks.push({
      key: "editable",
      label: "File type",
      claimed: "–",
      found: "Word file, easy to edit. DLD issues PDFs, so ask for the original.",
      result: "check",
    })
  }

  await prisma.listingReview.update({ where: { listingId }, data: { checks: JSON.stringify(checks) } })
}
