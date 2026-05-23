"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Notif = {
  id: string
  type: string
  message: string
  createdAt: string
  listing: { id: string; projectName: string } | null
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : [])
      .then(setNotifs)
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function handleOpen() {
    setOpen((v) => !v)
    if (!open && notifs.length > 0) {
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
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {notifs.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {notifs.length > 9 ? "9+" : notifs.length}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-1rem)] rounded-xl border bg-card shadow-lg",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
        )}>
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          {notifs.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">All caught up</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y">
              {notifs.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                  {n.listing ? (
                    <Link href={`/listings/${n.listing.id}`} onClick={() => setOpen(false)}>
                      <p className="text-xs font-medium">{n.listing.projectName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
