"use client"

import { useEffect, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { spring } from "@/lib/motion"

// Phones only. The bar slides up once the price under the title has scrolled off the top,
// so the price is never on screen twice.
export function ContactBar({ watchId, children }: { watchId: string; children: ReactNode }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const target = document.getElementById(watchId)
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [watchId])

  return (
    <motion.div
      data-contact-bar
      inert={!shown}
      initial={false}
      animate={shown ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
      transition={spring}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] opacity-0 lg:hidden"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">{children}</div>
    </motion.div>
  )
}
