import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { deletePhotos, setListingPhotos } from "@/lib/photos"
import { attachDeed, deleteDocuments } from "@/lib/documents"
import { refreshChecks } from "@/lib/listing-review"
import {
  VERIFIED_FIELDS,
  missingFields,
  occupancyFields,
  pickPrivateFields,
  pickPublicFields,
} from "@/lib/listing-rules"
import { isPublicStatus } from "@/lib/utils"
import type { Prisma } from "@/lib/generated/prisma/client"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, reraNumber: true },
        },
        photos: { select: { id: true }, orderBy: { position: "asc" } },
      },
    })

    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const session = await auth()
    const isOwner = session?.user?.id === listing.agentId
    if (!isOwner) {
      if (!isPublicStatus(listing.status)) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(listing)
    }

    const [review, deed] = await Promise.all([
      prisma.listingReview.findUnique({ where: { listingId: id } }),
      prisma.ownerDocument.findFirst({
        where: { listingId: id, kind: "TITLE_DEED" },
        select: { id: true, fileName: true },
      }),
    ])
    return NextResponse.json({
      ...listing,
      propertyNumber: review?.propertyNumber ?? null,
      isExclusive: review?.isExclusive ?? null,
      amountPaid: review?.amountPaid ?? null,
      poaAvailable: review?.poaAvailable ?? null,
      reviewNote: review?.note ?? null,
      deed,
    })
  } catch (err) {
    logger.error("listing.get_failed", err, { listingId: id })
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  logger.setUser(session.user.id, session.user.email ?? undefined)

  const { id } = await ctx.params
  const body = await req.json()

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.agentId !== session.user.id) {
    logger.warn("listing.update_forbidden", { userId: session.user.id, listingId: id, ownerId: listing.agentId })
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { notes, action, photoIds, deedId } = body
  const rest = pickPublicFields(body)
  const privateFields = pickPrivateFields(body)
  const data: Record<string, unknown> = { ...rest, ...occupancyFields(rest.occupancy) }

  // Owners can only set these statuses, and only once a listing has been approved:
  // EXPIRED is for the cron job, the review statuses for the reviewer.
  const inReview = listing.status === "PENDING_REVIEW" || listing.status === "REJECTED"
  if (body.status !== undefined && body.status !== listing.status) {
    if (inReview || !["ACTIVE", "RESERVED", "SOLD"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    data.status = body.status
  }

  const [review, currentDeed] = await Promise.all([
    prisma.listingReview.findUnique({ where: { listingId: id } }),
    prisma.ownerDocument.findFirst({ where: { listingId: id, kind: "TITLE_DEED" }, select: { id: true } }),
  ])
  const current = listing as unknown as Record<string, unknown>
  const blank = (v: unknown) => (v === "" || v === undefined ? null : v)
  const changed = (a: unknown, b: unknown) => blank(a) !== blank(b)
  const verifiedFieldChanged = VERIFIED_FIELDS.some((f) => f in rest && changed(rest[f], current[f]))
  const propertyChanged = "propertyNumber" in privateFields && changed(privateFields.propertyNumber, review?.propertyNumber)
  const newDeed = !!deedId && deedId !== currentDeed?.id
  const needsReview = listing.status === "REJECTED" || verifiedFieldChanged || propertyChanged || newDeed

  if (needsReview || listing.status === "PENDING_REVIEW") {
    const merged = { ...current, ...review, ...rest, ...privateFields, deedId: deedId ?? currentDeed?.id }
    const missing = missingFields(merged)
    if (missing.length > 0) {
      return NextResponse.json({ error: "missing_fields", fields: missing }, { status: 422 })
    }
  }
  if (needsReview) data.status = "PENDING_REVIEW"

  if (notes !== undefined) data.description = notes ?? null
  if (data.bedrooms === null) delete data.bedrooms

  if (action === "refresh") {
    data.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    logger.info("listing.refreshed", { userId: session.user.id, listingId: id })
  }

  const isRent = (data.listingType ?? listing.listingType) === "RENT"

  if (data.price !== undefined) {
    data.priceLabel = isRent
      ? `AED ${Number(data.price).toLocaleString("en-AE")} / yr`
      : `AED ${Number(data.price).toLocaleString("en-AE")}`
  }

  const beds = (data.bedrooms ?? listing.bedrooms) as string
  const loc = (data.location ?? listing.location) as string
  const price = (data.price ?? listing.price) as number
  const bedsLabel = beds === "Studio" ? "Studio" : `${beds}BR`
  if (data.bedrooms !== undefined || data.location !== undefined || data.price !== undefined || data.listingType !== undefined) {
    data.title = isRent
      ? `${bedsLabel} in ${loc} – AED ${Math.round(price / 1000)}K/yr`
      : `${bedsLabel} in ${loc} – AED ${Math.round(price / 1000)}K`
  }

  const changedFields = Object.keys(rest).filter((k) => rest[k] !== current[k])

  try {
    if (newDeed && !(await attachDeed(id, session.user.id, deedId))) {
      return NextResponse.json({ error: "verification_incomplete" }, { status: 422 })
    }
    const updated = await prisma.listing.update({ where: { id }, data })
    await setListingPhotos(id, session.user.id, photoIds)

    if (Object.keys(privateFields).length > 0 && (review || needsReview)) {
      await prisma.listingReview.upsert({
        where: { listingId: id },
        update: { ...privateFields, ...(needsReview ? { note: null, reviewedAt: null } : {}) },
        create: { ...privateFields, listingId: id } as Prisma.ListingReviewUncheckedCreateInput,
      })
    }
    if (needsReview || updated.status === "PENDING_REVIEW") await refreshChecks(id)

    logger.info("listing.updated", {
      userId: session.user.id,
      listingId: id,
      changedFields,
      newStatus: data.status ?? listing.status,
    })
    return NextResponse.json(updated)
  } catch (err) {
    logger.error("listing.update_failed", err, { userId: session.user.id, listingId: id })
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  logger.setUser(session.user.id, session.user.email ?? undefined)

  const { id } = await ctx.params
  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.agentId !== session.user.id) {
    logger.warn("listing.delete_forbidden", { userId: session.user.id, listingId: id })
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    await deletePhotos({ listingId: id })
    await deleteDocuments({ listingId: id })
    await prisma.listing.delete({ where: { id } })
    logger.info("listing.deleted", {
      userId: session.user.id,
      listingId: id,
      projectName: listing.projectName,
      location: listing.location,
    })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    logger.error("listing.delete_failed", err, { userId: session.user.id, listingId: id })
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 })
  }
}
