import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id, read: false },
      include: { listing: { select: { id: true, projectName: true, location: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json(notifications)
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 })
  }
  // Limit batch size
  const ids = body.ids.slice(0, 100) as string[]

  try {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
