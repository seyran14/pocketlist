"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Menu, Pin, PinOff, X } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"
import { useT } from "@/components/I18nProvider"
import { Button } from "@/components/ui/button"
import { cn, HEADER_PIN_COOKIE } from "@/lib/utils"

// A cached page can carry an older server value, so the browser's cookie wins.
function readPinned(serverValue: boolean) {
  if (typeof document === "undefined") return serverValue
  return !document.cookie.split("; ").includes(`${HEADER_PIN_COOKIE}=0`)
}

export function SiteHeader({ initialPinned, action, children }: { initialPinned: boolean; action?: ReactNode; children: ReactNode }) {
  const t = useT()
  const [pinned, setPinned] = useState(() => readPinned(initialPinned))
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element
      // The language list and the support dialog open in portals outside the menu.
      if (menuRef.current?.contains(target) || target.closest('[role="listbox"], [role="dialog"]')) return
      setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || document.querySelector('[role="listbox"], [role="dialog"]')) return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const togglePin = () => {
    const next = !pinned
    document.cookie = `${HEADER_PIN_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`
    setPinned(next)
  }

  // Never sticky on phones: iOS Safari shows the page above a stuck header, behind the status bar.
  return (
    <header className={cn("group/header relative z-50 border-b bg-card", pinned && "sm:sticky sm:top-0")}>
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <BrandLogo />
        <div className="flex items-center gap-2">
          {action}
          <Button
            ref={buttonRef}
            variant="ghost"
            size="sm"
            className="relative size-9 px-0 max-sm:size-11"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("Menu")}
            aria-expanded={open}
            aria-controls="site-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
            <span aria-hidden="true" className="absolute end-1 top-1 hidden size-2 rounded-full bg-red-500 group-has-[[data-unread]]/header:block" />
          </Button>
        </div>

        <div
          ref={menuRef}
          id="site-menu"
          hidden={!open}
          onClick={(e) => { if ((e.target as Element).closest('a, [role="option"]')) setOpen(false) }}
          className="absolute end-4 top-full mt-2 max-h-[calc(100dvh-5rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border bg-card p-2 shadow-lg"
        >
          {children}
          <Button variant="ghost" size="sm" className="hidden w-full justify-start gap-2 sm:flex" onClick={togglePin}>
            {pinned ? <Pin size={16} /> : <PinOff size={16} />}
            {pinned ? t("Unpin header") : t("Pin header")}
          </Button>
        </div>
      </div>
    </header>
  )
}
