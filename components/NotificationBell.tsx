"use client"

import { useT } from "@/components/I18nProvider"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { spring } from "@/lib/motion"

type Notif = {
  id: string
  type: string
  message: string
  createdAt: string
  listing: { id: string; projectName: string } | null
}

export function NotificationBell() {
  const t = useT()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [seen, setSeen] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : [])
      .then(setNotifs)
      .catch(() => {})
  }, [])

  async function handleOpen() {
    setOpen((v) => !v)
    if (!open && notifs.length > 0) {
      setSeen(notifs)
      const ids = notifs.map((n) => n.id)
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      setNotifs([])
    }
  }

  return (
    <div>
      <button
        onClick={handleOpen}
        aria-expanded={open}
        className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-sm font-medium hover:bg-muted"
      >
        {t("Notifications")}
        {notifs.length > 0 && (
          <motion.span
            key={notifs.length}
            data-unread
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="ms-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-background leading-none"
          >
            {notifs.length > 9 ? "9+" : notifs.length}
          </motion.span>
        )}
      </button>

      {open && (
        seen.length === 0 ? (
          <p className="px-3 py-3 text-center text-sm text-muted-foreground">{t("All caught up")}</p>
        ) : (
          <div className="max-h-60 divide-y overflow-y-auto">
            {seen.map((n) => (
              <div key={n.id} className="px-3 py-2">
                {n.listing ? (
                  <Link href={`/listings/${n.listing.id}`}>
                    <p className="text-xs font-medium">{n.listing.projectName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
