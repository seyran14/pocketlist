"use server"

import { signIn, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!existing) {
    redirect("/login?error=not_registered")
  }

  const jar = await cookies()
  jar.set("pending_auth_email", email, { httpOnly: true, path: "/", maxAge: 900 })
  await signIn("resend", { email, redirectTo: "/dashboard" })
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string
  const role = formData.get("role") as "BUYER" | "AGENT"
  if (!email || !role) return

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    redirect("/login?error=already_registered")
  }

  await prisma.user.create({ data: { email, role } })

  const jar = await cookies()
  jar.set("pending_auth_email", email, { httpOnly: true, path: "/", maxAge: 900 })
  await signIn("resend", { email, redirectTo: "/dashboard" })
}
