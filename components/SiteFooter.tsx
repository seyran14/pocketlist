"use client"

import { usePathname } from "next/navigation"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useT } from "@/components/I18nProvider"
import { SUPPORT_EMAIL } from "@/lib/utils"

export function SiteFooter() {
  // The mobile feed fills the screen and has its own support button.
  const t = useT()
  if (usePathname().startsWith("/m/")) return null

  return (
    <footer className="relative border-t px-4 py-4 text-center text-xs text-muted-foreground">
      <div className="mx-auto w-fit">
        <div className="mb-1 flex justify-center"><LanguageSwitcher /></div>
        {t("Need help? Email")}{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  )
}
