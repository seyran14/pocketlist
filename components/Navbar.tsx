import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { NotificationBell } from "@/components/NotificationBell"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { SupportButton } from "@/components/SupportButton"

export async function Navbar() {
  const t = await getT()
  const session = await auth()
  const user = session?.user
  const isAgent = user?.role === "AGENT"

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Account"

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
          PocketList
        </Link>

        <nav className="flex items-center gap-1">
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
        </nav>
      </div>
    </header>
  )
}
