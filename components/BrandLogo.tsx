"use client"

import Link from "next/link"
import { useEffect, useLayoutEffect, useRef } from "react"

const WORD = "PocketList"
const DURATION_MS = 900
const COLLAPSE_AT = 96
const EXPAND_AT = 48

// Letter index -> fold step. Both halves close from the right, one pair at a time.
const FOLD_STEP: Record<number, number> = { 9: 0, 5: 0, 8: 1, 4: 1, 7: 2, 3: 2, 2: 3, 1: 4 }
const STEP_GAP = 0.13
const FOLD_SPAN = 0.28
const LOCK_START = 0.72
const LOCK_SCALE = 0.12

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2)
const backOut = (v: number) => 1 + 2.70158 * (v - 1) ** 3 + 1.70158 * (v - 1) ** 2

// A letter hinged on its left edge takes up w * cos(angle), so the letters to its
// right close the gap by exactly what it gives up and the word stays joined.
function draw(word: HTMLElement, letters: HTMLElement[], widths: number[], progress: number) {
  const rtl = getComputedStyle(word.parentElement!).direction === "rtl"
  const folds = letters.map((_, i) =>
    i in FOLD_STEP ? easeInOut(clamp((progress - FOLD_STEP[i] * STEP_GAP) / FOLD_SPAN)) : 0
  )
  const gaps = folds.map((f, i) => widths[i] * (1 - Math.cos((f * Math.PI) / 2)))
  const total = gaps.reduce((sum, gap) => sum + gap, 0)

  let shift = rtl ? total : 0
  letters.forEach((letter, i) => {
    const hinge = i in FOLD_STEP ? ` perspective(160px) rotateY(${(i % 2 ? 90 : -90) * folds[i]}deg)` : ""
    letter.style.transform = `translateX(${shift}px)${hinge}`
    letter.style.opacity = String(clamp((1 - folds[i]) / 0.15))
    shift -= gaps[i]
  })

  word.style.transformOrigin = rtl ? "right center" : "left center"
  word.style.transform = `scale(${1 + LOCK_SCALE * backOut(clamp((progress - LOCK_START) / (1 - LOCK_START)))})`
}

export function BrandLogo() {
  const wordRef = useRef<HTMLSpanElement>(null)
  const progress = useRef(0)
  const widths = useRef<number[]>([])

  useLayoutEffect(() => {
    const word = wordRef.current!
    const letters = Array.from(word.children) as HTMLElement[]

    const measure = () => {
      word.style.transform = ""
      letters.forEach((letter) => (letter.style.transform = ""))
      widths.current = letters.map((letter) => letter.getBoundingClientRect().width)
      draw(word, letters, widths.current, progress.current)
    }

    progress.current = window.scrollY > COLLAPSE_AT ? 1 : 0
    measure()
    document.fonts?.ready.then(measure)
  }, [])

  useEffect(() => {
    const word = wordRef.current!
    const letters = Array.from(word.children) as HTMLElement[]
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let target = progress.current
    let frame = 0
    let last = 0

    const tick = (now: number) => {
      const step = (now - last) / DURATION_MS
      last = now
      const next = progress.current + Math.sign(target - progress.current) * step
      progress.current = target > progress.current ? Math.min(next, target) : Math.max(next, target)
      draw(word, letters, widths.current, progress.current)
      frame = progress.current === target ? 0 : requestAnimationFrame(tick)
    }

    const onScroll = () => {
      const y = window.scrollY
      const wanted = y > COLLAPSE_AT ? 1 : y < EXPAND_AT ? 0 : target
      if (wanted === target) return
      target = wanted
      if (reduced.matches) {
        progress.current = target
        draw(word, letters, widths.current, target)
      } else if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Link href="/" aria-label={WORD} className="font-bold text-lg tracking-tight shrink-0">
      <span ref={wordRef} dir="ltr" aria-hidden className="inline-flex">
        {WORD.split("").map((letter, i) => (
          <span key={i} className="inline-block">{letter}</span>
        ))}
      </span>
    </Link>
  )
}
