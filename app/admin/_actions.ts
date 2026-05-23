"use server"

import { timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function verifyAdminPassword(formData: FormData) {
  const password = formData.get("password") as string
  const adminPass = process.env.ADMIN_PASSWORD ?? ""
  const match = password.length === adminPass.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(adminPass))
  if (match) {
    const jar = await cookies()
    jar.set("admin_verified", "1", {
      httpOnly: true,
      path: "/admin",
      maxAge: 60 * 60 * 8, // 8 hours
    })
    redirect("/admin")
  }
  redirect("/admin?error=1")
}
