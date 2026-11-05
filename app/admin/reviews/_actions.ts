"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { isAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { reviewEmailHtml } from "@/lib/emails/reviewEmail"
import { EMAIL_FROM, SUPPORT_EMAIL } from "@/lib/utils"

const LISTING_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

async function tellOwner(listing: { id: string; projectName: string; agentId: string; agent: { email: string } }, approved: boolean, note?: string) {
  const message = approved
    ? `${listing.projectName} was approved and is now live.`
    : `${listing.projectName} needs changes: ${note}`
  await prisma.notification.create({
    data: {
      userId: listing.agentId,
      listingId: listing.id,
      type: approved ? "LISTING_APPROVED" : "LISTING_REJECTED",
      message,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pocketlist.ae"
  const path = approved ? `/listings/${listing.id}` : `/dashboard/listings/${listing.id}/edit`
  try {
    // Resend reports most failures in the result rather than by throwing.
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: EMAIL_FROM,
      to: listing.agent.email,
      replyTo: SUPPORT_EMAIL,
      subject: approved ? "Your listing is live" : "Your listing needs changes",
      html: reviewEmailHtml({ listingName: listing.projectName, listingUrl: `${baseUrl}${path}`, approved, note }),
    })
    if (error) logger.error("review.email_failed", error, { listingId: listing.id })
  } catch (err) {
    logger.error("review.email_failed", err, { listingId: listing.id })
  }
}

export async function reviewListing(formData: FormData) {
  if (!(await isAdminSession())) return

  const id = String(formData.get("id"))
  const approved = formData.get("decision") === "approve"
  const note = String(formData.get("note") ?? "").trim()
  if (!approved && !note) return

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, projectName: true, agentId: true, status: true, agent: { select: { email: true } } },
  })
  if (listing?.status !== "PENDING_REVIEW") return

  await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: approved
        ? { status: "ACTIVE", expiresAt: new Date(Date.now() + LISTING_LIFETIME_MS) }
        : { status: "REJECTED" },
    }),
    prisma.listingReview.update({
      where: { listingId: id },
      data: { reviewedAt: new Date(), note: approved ? null : note },
    }),
  ])
  logger.info("review.decided", { listingId: id, approved })

  await tellOwner(listing, approved, note)
  revalidatePath("/admin/reviews")
}
