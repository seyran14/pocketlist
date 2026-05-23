import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

async function isAdmin() {
  const session = await auth()
  return session?.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    logger.warn("admin.unauthorized_patch", { path: req.nextUrl.pathname })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, role } = await req.json()
  if (!id || !["BUYER", "AGENT"].includes(role)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({ where: { id }, data: { role } })
    logger.info("admin.role_changed", { targetUserId: id, newRole: role, userEmail: logger.maskEmail(user.email ?? "") })
    return NextResponse.json(user)
  } catch (err) {
    logger.error("admin.role_change_failed", err, { targetUserId: id, role })
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    logger.warn("admin.unauthorized_delete", { path: req.nextUrl.pathname })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  try {
    await prisma.savedListing.deleteMany({ where: { userId: id } })
    await prisma.notification.deleteMany({ where: { userId: id } })
    await prisma.listing.deleteMany({ where: { agentId: id } })
    await prisma.session.deleteMany({ where: { userId: id } })
    await prisma.account.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })
    logger.info("admin.user_deleted", { targetUserId: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("admin.user_delete_failed", err, { targetUserId: id })
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
}
