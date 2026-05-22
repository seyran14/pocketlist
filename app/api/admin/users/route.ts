import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function isAdmin() {
  const session = await auth()
  return session?.user?.email === process.env.ADMIN_EMAIL
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, role } = await req.json()
  if (!id || !["BUYER", "AGENT"].includes(role)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id }, data: { role } })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  await prisma.savedListing.deleteMany({ where: { userId: id } })
  await prisma.notification.deleteMany({ where: { userId: id } })
  await prisma.session.deleteMany({ where: { userId: id } })
  await prisma.account.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
