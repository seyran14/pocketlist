import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { NotificationBell } from "@/components/NotificationBell"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { SupportButton } from "@/components/SupportButton"
import { SiteHeader } from "@/components/SiteHeader"
import { HEADER_PIN_COOKIE } from "@/lib/utils"

export async function Navbar() {
  const t = await getT()
  const session = await auth()
  const user = session?.user
  const isAgent = user?.role === "AGENT"

  const pinned = (await cookies()).get(HEADER_PIN_COOKIE)?.value !== "0"

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Account"

  return (
    <SiteHeader initialPinned={pinned}>
      <LanguageSwitcher />
      <ThemeToggle />
      <SupportButton />
      {user ? (
        <>
          {isAgent ? (
            <>
              <Link href="/dashboard/listings/new" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-sm">
                  {t("+ Add listing")}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-sm">
                  {t("Dashboard")}
                </Button>
              </Link>
              <NotificationBell />
            </>
          ) : (
            <Link href="/dashboard/saved">
              <Button variant="ghost" size="sm" className="text-sm">
                {t("Saved")}
              </Button>
            </Link>
          )}

          {user?.email === process.env.ADMIN_EMAIL && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-sm">
                {t("Admin")}
              </Button>
            </Link>
          )}

          <Link href="/profile" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground max-w-[120px] truncate"
              title={displayName}
            >
              {displayName}
            </Button>
          </Link>

          <form action={signOutAction}>
            <Button variant="outline" size="sm" type="submit" className="text-sm">
              {t("Sign out")}
            </Button>
          </form>
        </>
      ) : (
        <Link href="/login">
          <Button size="sm">{t("Sign in")}</Button>
        </Link>
      )}
    </SiteHeader>
  )
}
