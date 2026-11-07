"use client"

import { MotionConfig } from "motion/react"
import type { ReactNode } from "react"

// "user" follows prefers-reduced-motion: transforms are skipped, opacity still fades.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
