"use client"

import { useEffect, useRef } from "react"

const STEP = 14
const MAX_RADIUS = 3
const CLEAR_CENTER = 0.28 // No dots inside this share of the distance to the edge.
const DOT_OPACITY = 0.24

// A fixed pseudo-random value per dot, so the pattern doesn't change on resize.
function noise(col: number, row: number) {
  const n = Math.sin(col * 127.1 + row * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function draw(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const ctx = canvas.getContext("2d")
  if (!ctx || !width || !height) return

  ctx.scale(ratio, ratio)
  ctx.fillStyle = getComputedStyle(canvas).color
  ctx.globalAlpha = DOT_OPACITY

  const centerX = width / 2
  const centerY = height / 2
  for (let row = 0, y = (height % STEP) / 2; y < height; row++, y += STEP) {
    for (let col = 0, x = (width % STEP) / 2; x < width; col++, x += STEP) {
      const distance = Math.hypot((x - centerX) / centerX, (y - centerY) / centerY)
      const strength = Math.min(1, (distance - CLEAR_CENTER) / (1.15 - CLEAR_CENTER))
      if (strength <= 0 || noise(col, row) > 0.15 + strength * 0.85) continue
      ctx.beginPath()
      ctx.arc(x, y, 0.4 + (MAX_RADIUS - 0.4) * strength * strength, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function DotMatrix() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const redraw = () => draw(canvas)
    redraw()

    const resize = new ResizeObserver(redraw)
    resize.observe(canvas)
    const theme = new MutationObserver(redraw)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => {
      resize.disconnect()
      theme.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-foreground" />
}
