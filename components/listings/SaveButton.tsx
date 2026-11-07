"use client"

import { useT } from "@/components/I18nProvider"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { motion } from "motion/react"
import { springAfterGesture } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SaveButton({
  listingId,
  initialSaved,
}: {
  listingId: string
  initialSaved: boolean
}) {
  const t = useT()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  // Guests can tap the heart too; saving needs an account, so they go to sign in.
  async function toggle() {
    if (loading) return
    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}/save`, { method: "POST" }).catch(() => null)
    if (res?.status === 401) router.push("/login")
    else if (res?.ok) setSaved((await res.json()).saved)
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0 max-sm:size-11"
      onClick={toggle}
      disabled={loading}
      aria-pressed={saved}
      aria-label={saved ? t("Saved") : t("Save listing")}
      title={saved ? t("Saved") : t("Save listing")}
    >
      {/* The filled heart fades over the outline one and lands with a small spring. */}
      <span className="relative size-4 shrink-0">
        <Heart className={cn("absolute inset-0 size-4 text-muted-foreground transition-opacity duration-150", saved && "opacity-0")} />
        <motion.span
          className="absolute inset-0"
          initial={false}
          animate={saved ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={springAfterGesture}
        >
          <Heart className="size-4 fill-primary text-primary" />
        </motion.span>
      </span>
    </Button>
  )
}
