import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { inquiryEmailHtml } from "@/lib/emails/inquiryEmail"
import { checkRateLimit } from "@/lib/ratelimit"

type Ctx = { params: Promise<{ id: string }> }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest, ctx: Ctx) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const { allowed } = checkRateLimit(`inquiry:${ip}`, 10, 60)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const { email, name, message } = body

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true,
      projectName: true,
      agent: { select: { name: true, email: true } },
    },
  })

  if (!listing || !listing.agent?.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const listingTitle = listing.title || listing.projectName
    const baseUrl = req.headers.get("origin") ?? "https://pocketlist.ae"

    await resend.emails.send({
      from: "PocketList <noreply@rncn8n.com>",
      to: listing.agent.email,
      replyTo: email,
      subject: `New inquiry for ${listingTitle}`,
      html: inquiryEmailHtml({
        agentName: listing.agent.name ?? "there",
        listingTitle,
        listingUrl: `${baseUrl}/listings/${id}`,
        buyerEmail: email,
        buyerName: name || undefined,
        message: message || undefined,
      }),
    })
  } catch {
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
