"use client"

import { useState, type ReactNode } from "react"
import { Pin, PinOff } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"
import { useT } from "@/components/I18nProvider"
import { Button } from "@/components/ui/button"
import { cn, HEADER_PIN_COOKIE } from "@/lib/utils"

// A cached page can carry an older server value, so the browser's cookie wins.
function readPinned(serverValue: boolean) {
  if (typeof document === "undefined") return serverValue
  return !document.cookie.split("; ").includes(`${HEADER_PIN_COOKIE}=0`)
}

export function SiteHeader({ initialPinned, children }: { initialPinned: boolean; children: ReactNode }) {
  const t = useT()
  const [pinned, setPinned] = useState(() => readPinned(initialPinned))

  const toggle = () => {
    const next = !pinned
    document.cookie = `${HEADER_PIN_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`
    setPinned(next)
  }

  const label = pinned ? t("Unpin header") : t("Pin header")

  return (
    <header className={cn("z-50 border-b bg-card", pinned ? "sticky top-0" : "relative")}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <BrandLogo />
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex w-8 h-8 px-0" onClick={toggle} aria-label={label} title={label}>
            {pinned ? <Pin size={16} /> : <PinOff size={16} />}
          </Button>
          {children}
        </nav>
      </div>
    </header>
  )
}
