import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role

  const isAgentOnlyPath =
    pathname.startsWith("/dashboard/listings/new") ||
    (pathname.startsWith("/dashboard/listings/") && pathname.endsWith("/edit"))

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isAgentOnlyPath && role !== "AGENT") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/profile/:path*"],
}
