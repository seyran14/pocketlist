"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SaveButton({
  listingId,
  initialSaved,
}: {
  listingId: string
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [popping, setPopping] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    await fetch(`/api/listings/${listingId}/save`, { method: "POST" })
    const next = !saved
    setSaved(next)
    if (next) {
      setPopping(true)
      setTimeout(() => setPopping(false), 400)
    }
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-2"
      onClick={toggle}
      disabled={loading}
    >
      {/* Icon swap: two overlapping hearts, one fades out while other fades in */}
      <span className="relative w-4 h-4 shrink-0">
        {/* Outline heart — shown when NOT saved */}
        <Heart
          className={cn(
            "absolute inset-0 w-4 h-4 transition-all duration-[180ms]",
            saved
              ? "opacity-0 scale-50 blur-[2px]"
              : "opacity-100 scale-100 blur-0 text-muted-foreground"
          )}
        />
        {/* Filled heart — shown when saved */}
        <Heart
          className={cn(
            "absolute inset-0 w-4 h-4 fill-current transition-all duration-[200ms]",
            popping && "heart-pop",
            saved
              ? "opacity-100 scale-100 blur-0 text-red-500"
              : "opacity-0 scale-50 blur-[2px] text-red-500"
          )}
        />
      </span>
      <span>{saved ? "Saved" : "Save listing"}</span>
    </Button>
  )
}
