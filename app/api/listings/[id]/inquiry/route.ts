import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { inquiryEmailHtml } from "@/lib/emails/inquiryEmail"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { email, name, message } = await req.json()

  if (!email || typeof email !== "string" || !email.includes("@")) {
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

  if (!listing || !listing.agent.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

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

  return NextResponse.json({ ok: true })
}
