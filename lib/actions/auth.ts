"use server"

import { signIn, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { checkRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { clientIp } from "@/lib/request-ip"

async function getClientIP(): Promise<string> {
  return clientIp(await headers())
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return

  const ip = await getClientIP()
  const { allowed } = checkRateLimit(`auth:${ip}`, 5, 15)
  if (!allowed) {
    logger.warn("auth.rate_limited", { ip, action: "login" })
    redirect("/login?error=rate_limited")
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!existing) {
    logger.warn("auth.login_not_registered", { email: logger.maskEmail(email), ip })
    redirect("/login?error=not_registered")
  }

  logger.info("auth.otp_sent", { email: logger.maskEmail(email), ip })

  const jar = await cookies()
  jar.set("pending_auth_email", email, { httpOnly: true, path: "/", maxAge: 900 })
  await signIn("resend", { email, redirectTo: "/dashboard" })
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string
  const role = formData.get("role") as "BUYER" | "AGENT"
  if (!email || !role) return

  const ip = await getClientIP()
  const { allowed } = checkRateLimit(`auth:${ip}`, 5, 15)
  if (!allowed) {
    logger.warn("auth.rate_limited", { ip, action: "register" })
    redirect("/login?error=rate_limited")
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    logger.warn("auth.register_already_exists", { email: logger.maskEmail(email), ip })
    redirect("/login?error=already_registered")
  }

  await prisma.user.create({ data: { email, role } })
  logger.info("auth.registered", { email: logger.maskEmail(email), role, ip })

  const jar = await cookies()
  jar.set("pending_auth_email", email, { httpOnly: true, path: "/", maxAge: 900 })
  await signIn("resend", { email, redirectTo: "/dashboard" })
}
