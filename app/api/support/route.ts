import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supportEmailHtml } from "@/lib/emails/supportEmail"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SUPPORT_INBOX = "saparovseyran@gmail.com"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const { allowed } = checkRateLimit(`support:${ip}`, 5, 60)
  if (!allowed) {
    logger.warn("ratelimit.support", { ip })
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const { email, message } = body

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    logger.warn("support.invalid_email", { ip })
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 })
  }

  const trimmed = message.trim().slice(0, 4000)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : undefined

    await resend.emails.send({
      from: "PocketList <noreply@rncn8n.com>",
      to: SUPPORT_INBOX,
      replyTo: email,
      subject: `[poketlist support] message from ${email}`,
      html: supportEmailHtml({ fromEmail: email, message: trimmed, pageUrl }),
    })

    logger.info("support.sent", {
      fromEmail: logger.maskEmail(email),
      length: trimmed.length,
    })
  } catch (err) {
    logger.error("support.email_failed", err, { ip })
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
