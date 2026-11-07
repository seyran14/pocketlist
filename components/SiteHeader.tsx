"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Menu, X } from "lucide-react"
import { motion } from "motion/react"
import { BrandLogo } from "@/components/BrandLogo"
import { useT } from "@/components/I18nProvider"
import { Button } from "@/components/ui/button"
import { spring } from "@/lib/motion"

export function SiteHeader({ action, children }: { action?: ReactNode; children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element
      // The menu button toggles by itself: closing here too would let its click reopen the menu.
      if (buttonRef.current?.contains(target)) return
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

  // Never sticky on phones: iOS Safari shows the page above a stuck header, behind the status bar.
  return (
    <header className="group/header relative z-50 border-b bg-card sm:sticky sm:top-0">
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
            <span aria-hidden="true" className="absolute end-1 top-1 hidden size-2 rounded-full bg-destructive group-has-[[data-unread]]/header:block" />
          </Button>
        </div>

        {/* Stays mounted while closed: the unread dot on the menu button reads the bell inside it. */}
        <motion.div
          ref={menuRef}
          id="site-menu"
          inert={!open}
          initial={false}
          animate={open ? { opacity: 1, scale: 1, visibility: "visible" } : { opacity: 0, scale: 0.96, transitionEnd: { visibility: "hidden" } }}
          transition={spring}
          onClick={(e) => { if ((e.target as Element).closest('a, [role="option"]')) setOpen(false) }}
          className="invisible absolute end-4 top-full mt-2 max-h-[calc(100dvh-5rem)] w-72 max-w-[calc(100vw-2rem)] origin-top-right overflow-y-auto rounded-xl border bg-popover p-2 opacity-0 shadow-pop rtl:origin-top-left"
        >
          {children}
        </motion.div>
      </div>
    </header>
  )
}
