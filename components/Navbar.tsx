import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { BookOpen, Heart, LayoutDashboard, LogOut, Plus, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signOutAction } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { NotificationBell } from "@/components/NotificationBell"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
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
          <Button size="lg" className="px-4">{t("Sign in")}</Button>
        </Link>
      )}
    >
      <Link href="/guide">
        <Button variant="ghost" size="sm" className={row}>
          <BookOpen size={16} />
          {t("Guide")}
        </Button>
      </Link>

      {user && (
        <>
          {isAgent ? (
            <>
              <Link href="/dashboard/listings/new">
                <Button variant="ghost" size="sm" className={row}>
                  <Plus size={16} />
                  {t("+ Add listing").replace(/^\+\s*/, "")}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className={row}>
                  <LayoutDashboard size={16} />
                  {t("Dashboard")}
                </Button>
              </Link>
              <NotificationBell />
            </>
          ) : (
            <Link href="/dashboard/saved">
              <Button variant="ghost" size="sm" className={row}>
                <Heart size={16} />
                {t("Saved")}
              </Button>
            </Link>
          )}

          {user.email === process.env.ADMIN_EMAIL && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className={row}>
                <Shield size={16} />
                {t("Admin")}
              </Button>
            </Link>
          )}

          <Link href="/profile">
            <Button variant="ghost" size="sm" className={row} title={displayName}>
              <User size={16} />
              <span className="truncate">{displayName}</span>
            </Button>
          </Link>
        </>
      )}

      <Separator className="my-2" />
      <LanguageSwitcher row />
      <ThemeToggle row />
      <SupportButton row />

      {user && (
        <form action={signOutAction}>
          <Button variant="ghost" size="sm" type="submit" className={row}>
            <LogOut size={16} />
            {t("Sign out")}
          </Button>
        </form>
      )}
    </SiteHeader>
  )
}
