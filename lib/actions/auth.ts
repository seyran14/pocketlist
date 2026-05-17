"use server"

import { signIn, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string
  const role = formData.get("role") as "BUYER" | "AGENT"
  if (!email || !role) return

  // Only set role on creation — never overwrite an existing user's role
  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    await prisma.user.create({ data: { email, role } })
  }

  const jar = await cookies()
  jar.set("pending_auth_email", email, { httpOnly: true, path: "/", maxAge: 900 })
  await signIn("resend", { email, redirectTo: "/dashboard" })
}
