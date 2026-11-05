"use client"

import { usePathname } from "next/navigation"
import { SUPPORT_EMAIL } from "@/lib/utils"

export function SiteFooter() {
  // The mobile feed fills the screen and has its own support button.
  if (usePathname().startsWith("/m/")) return null

  return (
    <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
      Need help? Email{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
        {SUPPORT_EMAIL}
      </a>
    </footer>
  )
}
