import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

// Same two checks as the admin page: the admin account, plus the admin password
// cookie, which is scoped to /admin.
export async function isAdminSession() {
  const session = await auth()
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) return false
  const jar = await cookies()
  return jar.get("admin_verified")?.value === "1"
}
