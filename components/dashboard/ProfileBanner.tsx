"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const STORAGE_KEY = "profile_banner_dismissed"

export function ProfileBanner({ hasName }: { hasName: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasName && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [hasName])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  return (
    <div className="card-animate mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ animationDelay: "60ms" }}>
      <span className="text-amber-800 dark:text-amber-300">
        Complete your profile so buyers can contact you.
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/profile">
          <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
            Set up profile →
          </Button>
        </Link>
        <button
          onClick={dismiss}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
