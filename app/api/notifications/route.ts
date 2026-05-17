import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, read: false },
    include: { listing: { select: { id: true, projectName: true, location: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids } = await req.json()
  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
