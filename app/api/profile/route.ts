import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/ratelimit"

const MAX_LENGTHS: Record<string, number> = {
  name: 100,
  phone: 30,
  whatsapp: 30,
  telegram: 50,
  contactPref: 100,
  reraNumber: 50,
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        telegram: true,
        contactPref: true,
        reraNumber: true,
      },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { allowed } = checkRateLimit(`profile:${session.user.id}`, 20, 60)
  if (!allowed) {
    return NextResponse.json({ error: "Too many updates. Try again later." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  // Validate field lengths
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (body[field] && typeof body[field] === "string" && body[field].length > max) {
      return NextResponse.json({ error: `${field} is too long (max ${max} chars)` }, { status: 400 })
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name || null,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        telegram: body.telegram || null,
        contactPref: body.contactPref || null,
        reraNumber: body.reraNumber || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        telegram: true,
        contactPref: true,
        reraNumber: true,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
