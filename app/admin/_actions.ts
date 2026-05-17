"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function verifyAdminPassword(formData: FormData) {
  const password = formData.get("password") as string
  if (password === process.env.ADMIN_PASSWORD) {
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
