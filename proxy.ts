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
    const login = new URL("/login", req.url)
    login.searchParams.set("next", pathname + req.nextUrl.search)
    return NextResponse.redirect(login)
  }

  if (isAgentOnlyPath && role !== "AGENT") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/profile/:path*"],
}
