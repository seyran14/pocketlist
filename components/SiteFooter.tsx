"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useT } from "@/components/I18nProvider"

const HEADERLESS = ["/login", "/register", "/auth/", "/contracts/", "/admin/login"]

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function SiteFooter() {
  // The mobile feed fills the screen and has its own support button.
  const t = useT()
  const pathname = usePathname()
  if (pathname.startsWith("/m/")) return null
  // Pages with the site header carry the language switcher in its menu.
  const headerless = HEADERLESS.some((prefix) => pathname.startsWith(prefix))

  return (
    <footer className="relative border-t py-5 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between">
        <nav aria-label={t("Site")} className="grid grid-cols-2 justify-items-center gap-x-8 gap-y-1 sm:flex sm:gap-x-5">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="underline-offset-4 hover:text-foreground hover:underline">
              {t(link.label)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {headerless && <LanguageSwitcher />}
          <span className="text-xs">© {new Date().getFullYear()} PocketList</span>
        </div>
      </div>
    </footer>
  )
}
