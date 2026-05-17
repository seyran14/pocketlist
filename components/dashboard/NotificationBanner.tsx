"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { daysAgo } from "@/lib/utils"
import { toast } from "sonner"

type ExpiringListing = {
  id: string
  projectName: string
  location: string
  createdAt: string
  expiresAt: string
}

export function NotificationBanner({ listings }: { listings: ExpiringListing[] }) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const visible = listings.filter((l) => !hidden.has(l.id))
  if (dismissed || visible.length === 0) return null

  async function keepActive(id: string, projectName: string) {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh" }),
    })
    if (res.ok) {
      setHidden((prev) => new Set([...prev, id]))
      toast.success(`${projectName} renewed for 30 days`)
      startTransition(() => router.refresh())
    }
  }

  async function markSold(id: string, projectName: string) {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SOLD" }),
    })
    if (res.ok) {
      setHidden((prev) => new Set([...prev, id]))
      toast.success(`${projectName} marked as sold`)
      startTransition(() => router.refresh())
    }
  }

  async function deleteListing(id: string, projectName: string) {
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      setHidden((prev) => new Set([...prev, id]))
      toast.success(`${projectName} deleted`)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-amber-800">
          {visible.length} listing{visible.length !== 1 ? "s are" : " is"} over 30 days old. Still active?
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 shrink-0"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </Button>
      </div>

      <div className="space-y-2">
        {visible.map((l) => (
          <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg bg-card border border-amber-100 px-3 py-2">
            <span className="text-sm font-medium flex-1 min-w-0 truncate">
              {l.projectName} · {l.location}
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                posted {daysAgo(new Date(l.createdAt))}
              </span>
            </span>
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                disabled={isPending}
                onClick={() => keepActive(l.id, l.projectName)}
              >
                Keep Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isPending}
                onClick={() => markSold(l.id, l.projectName)}
              >
                Mark Sold
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                disabled={isPending}
                onClick={() => deleteListing(l.id, l.projectName)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
