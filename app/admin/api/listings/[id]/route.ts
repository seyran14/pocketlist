import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { isAdminSession } from "@/lib/admin"
import { deletePhotos, setListingPhotos } from "@/lib/photos"
import { deleteDocuments } from "@/lib/documents"
import { refreshChecks } from "@/lib/listing-review"
import {
  applyDerivedFields,
  isValidDate,
  occupancyFields,
  pickPrivateFields,
  pickPublicFields,
} from "@/lib/listing-rules"

// These live under /admin because the admin password cookie is scoped to that path.

type Ctx = { params: Promise<{ id: string }> }

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 })
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 })

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdminSession())) return forbidden()
  const { id } = await ctx.params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { select: { id: true }, orderBy: { position: "asc" } }, review: true },
  })
  if (!listing) return notFound()

  const { review, ...rest } = listing
  return NextResponse.json({
    ...rest,
    propertyNumber: review?.propertyNumber ?? null,
    amountPaid: review?.amountPaid ?? null,
    reviewNote: review?.note ?? null,
  })
}

// An admin edit is final: it doesn't send the listing back for review.
export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAdminSession())) return forbidden()
  const { id } = await ctx.params
  const body = await req.json()

  const listing = await prisma.listing.findUnique({ where: { id }, include: { review: true } })
  if (!listing) return notFound()

  const rest = pickPublicFields(body)
  const { propertyNumber, ...privateFields } = pickPrivateFields(body)
  if (rest.occupancy === "RENTED" && !isValidDate(rest.availableFrom ?? listing.availableFrom)) {
    return NextResponse.json({ error: "missing_fields", fields: ["available from date"] }, { status: 422 })
  }

  const data: Record<string, unknown> = { ...rest, ...occupancyFields(rest.occupancy, rest.availableFrom) }
  const inReview = listing.status === "PENDING_REVIEW" || listing.status === "REJECTED"
  if (body.status !== undefined && body.status !== listing.status) {
    if (inReview || !["ACTIVE", "RESERVED", "SOLD"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    data.status = body.status
  }
  if (body.notes !== undefined) data.description = body.notes ?? null
  if (data.bedrooms === null) delete data.bedrooms
  applyDerivedFields(data, listing)

  try {
    await prisma.listing.update({ where: { id }, data })
    // Photos belong to the owner, so the admin can reorder and remove them but not add any.
    await setListingPhotos(id, listing.agentId, body.photoIds)

    const number = typeof propertyNumber === "string" ? propertyNumber.trim() : ""
    if (listing.review) {
      await prisma.listingReview.update({
        where: { listingId: id },
        data: { ...privateFields, ...(number ? { propertyNumber: number } : {}) },
      })
    } else if (number) {
      await prisma.listingReview.create({ data: { ...privateFields, propertyNumber: number, listingId: id } })
    }
    if (listing.status === "PENDING_REVIEW") await refreshChecks(id)

    logger.info("admin.listing_updated", { listingId: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("admin.listing_update_failed", err, { listingId: id })
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdminSession())) return forbidden()
  const { id } = await ctx.params

  const listing = await prisma.listing.findUnique({ where: { id }, select: { projectName: true, agentId: true } })
  if (!listing) return notFound()

  try {
    await deletePhotos({ listingId: id })
    await deleteDocuments({ listingId: id })
    await prisma.listing.delete({ where: { id } })
    logger.info("admin.listing_deleted", { listingId: id, projectName: listing.projectName, ownerId: listing.agentId })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    logger.error("admin.listing_delete_failed", err, { listingId: id })
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 })
  }
}
