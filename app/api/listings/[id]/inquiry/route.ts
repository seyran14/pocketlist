import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { EMAIL_FROM, isPublicStatus } from "@/lib/utils"
import { Resend } from "resend"
import { inquiryEmailHtml } from "@/lib/emails/inquiryEmail"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { recordEvent } from "@/lib/events"
import { clientIp } from "@/lib/request-ip"

type Ctx = { params: Promise<{ id: string }> }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest, ctx: Ctx) {
  const ip = clientIp(req.headers)
  const { allowed } = checkRateLimit(`inquiry:${ip}`, 10, 60)
  if (!allowed) {
    logger.warn("ratelimit.inquiry", { ip })
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  // Cap every field so the email stays a reasonable size; the template escapes them.
  const field = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined)
  const email = body.email
  const name = field(body.name, 100)
  const phone = field(body.phone, 40)
  const social = field(body.social, 100)
  const message = field(body.message, 2000)

  if (!email || typeof email !== "string" || email.length > 254 || !EMAIL_REGEX.test(email)) {
    logger.warn("inquiry.invalid_email", { listingId: id, ip })
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true,
      projectName: true,
      status: true,
      agent: { select: { name: true, email: true } },
    },
  })

  if (!listing || !isPublicStatus(listing.status) || !listing.agent?.email) {
    logger.warn("inquiry.listing_not_found", { listingId: id, ip })
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const listingTitle = listing.title || listing.projectName
    // Never build the link from request headers: Origin is set by the sender.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pocketlist.ae"

    await resend.emails.send({
      from: EMAIL_FROM,
      to: listing.agent.email,
      replyTo: email,
      subject: `New inquiry for ${listingTitle}`,
      html: inquiryEmailHtml({
        agentName: listing.agent.name ?? "there",
        listingTitle,
        listingUrl: `${baseUrl}/listings/${id}`,
        buyerEmail: email,
        buyerName: name,
        buyerPhone: phone,
        buyerSocial: social,
        message,
      }),
    })

    await recordEvent("inquiry_sent", id)

    logger.info("inquiry.sent", {
      listingId: id,
      buyerEmail: logger.maskEmail(email),
      agentEmail: logger.maskEmail(listing.agent.email),
      hasMessage: !!message,
      hasPhone: !!phone,
      hasSocial: !!social,
    })
  } catch (err) {
    logger.error("inquiry.email_failed", err, { listingId: id, ip })
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
