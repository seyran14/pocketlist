"use client"

import { useT } from "@/components/I18nProvider"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { motion } from "motion/react"
import { spring, springAfterGesture } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function CardSaveButton({ listingId, initialSaved }: { listingId: string; initialSaved: boolean }) {
  const t = useT()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    const previous = saved
    setLoading(true)
    setSaved(!previous)
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

  // The press lands on pointer-down; the release springs back with a little bounce.
  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={t("Save listing")}
      whileTap={{ scale: 0.82, transition: spring }}
      animate={{ scale: 1, transition: springAfterGesture }}
      className="absolute end-1 top-1 flex size-11 items-center justify-center rounded-full outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-white"
    >
      <span aria-hidden="true" className="scrim-soft absolute size-8 rounded-full" />
      <Heart
        className={cn("relative",
          "size-6 stroke-2 text-white drop-shadow-[0_1px_3px_rgb(0_0_0/0.55)]",
          saved ? "fill-primary stroke-white" : "fill-black/45"
        )}
      />
    </motion.button>
  )
}
