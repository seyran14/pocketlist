"use client"

import { useT } from "@/components/I18nProvider"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function CardSaveButton({ listingId, initialSaved }: { listingId: string; initialSaved: boolean }) {
  const t = useT()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [popping, setPopping] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    const previous = saved
    setLoading(true)
    setSaved(!previous)
    setPopping(!previous)
    try {
      const res = await fetch(`/api/listings/${listingId}/save`, { method: "POST" })
      if (res.status === 401) {
        setSaved(previous)
        router.push("/login")
      } else if (res.ok) {
        setSaved((await res.json()).saved)
      } else {
        setSaved(previous)
      }
    } catch {
      setSaved(previous)
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={t("Save listing")}
      className="absolute end-1 top-1 flex size-10 items-center justify-center rounded-full outline-offset-[-4px] transition-transform focus-visible:outline-2 focus-visible:outline-white active:scale-90 motion-reduce:transition-none"
    >
      <Heart
        onAnimationEnd={() => setPopping(false)}
        className={cn(
          "size-6 stroke-2 text-white drop-shadow-sm transition-colors",
          saved ? "fill-red-500 stroke-white" : "fill-black/40",
          popping && "heart-pop"
        )}
      />
    </button>
  )
}
