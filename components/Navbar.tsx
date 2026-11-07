import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signOutAction } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { NotificationBell } from "@/components/NotificationBell"
import { SupportButton } from "@/components/SupportButton"
import { SiteHeader } from "@/components/SiteHeader"

export async function Navbar() {
  const t = await getT()
  const session = await auth()
  const user = session?.user
  const isAgent = user?.role === "AGENT"

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Account"

  const row = "w-full justify-start gap-2"

  return (
    <SiteHeader
      action={!user && (
        <Link href="/login">
          <Button variant="outline">{t("Sign in")}</Button>
        </Link>
      )}
    >
      <Link href="/guide">
        <Button variant="ghost" size="sm" className={row}>
          {t("Guide")}
        </Button>
      </Link>

      {user && (
        <>
          {isAgent ? (
            <>
              <Link href="/dashboard/listings/new">
                <Button variant="ghost" size="sm" className={row}>
                  {t("Add listing")}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className={row}>
                  {t("Dashboard")}
                </Button>
              </Link>
              <NotificationBell />
            </>
          ) : (
            <Link href="/dashboard/saved">
              <Button variant="ghost" size="sm" className={row}>
                {t("Saved")}
              </Button>
            </Link>
          )}

          {user.email === process.env.ADMIN_EMAIL && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className={row}>
                {t("Admin")}
              </Button>
            </Link>
          )}

          <Link href="/profile">
            <Button variant="ghost" size="sm" className={row} title={displayName}>
              <span className="truncate">{displayName}</span>
            </Button>
          </Link>
        </>
      )}

      <Separator className="my-2" />
      <ThemeToggle row />
      <SupportButton row />

      {user && (
        <form action={signOutAction}>
          <Button variant="ghost" size="sm" type="submit" className={row}>
            {t("Sign out")}
          </Button>
        </form>
      )}
    </SiteHeader>
  )
}
