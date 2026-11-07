"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

const WORD = "PocketList"
// Two thresholds so the logo doesn't flicker when the page rests near one.
const COLLAPSE_AT = 96
const EXPAND_AT = 48

// A door arch: the outline is the home, the filled inner arch is the way in.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" className={cn("shrink-0 text-primary", className)}>
      <path d="M5 23V12a8 8 0 0 1 16 0v11z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M10 23v-6.5a3 3 0 0 1 6 0V23z" fill="currentColor" />
    </svg>
  )
}

// Once the sticky header has scrolled with the page, only the mark stays. The word
// keeps its space, so nothing beside the logo moves.
export function BrandLogo({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [rtl, setRtl] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setCollapsed((was) => (y > COLLAPSE_AT ? true : y < EXPAND_AT ? false : was))
    }
    onScroll()
    setRtl(getComputedStyle(linkRef.current!).direction === "rtl")
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <Link
      ref={linkRef}
      href="/"
      aria-label={WORD}
      className={cn("flex shrink-0 items-center gap-2 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring", className)}
    >
      <BrandMark className="size-[26px]" />
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={collapsed ? { opacity: 0, x: rtl ? 6 : -6 } : { opacity: 1, x: 0 }}
        transition={spring}
        className={cn("text-[17px] font-semibold tracking-[-0.025em]", collapsed && "pointer-events-none")}
      >
        {WORD}
      </motion.span>
    </Link>
  )
}
