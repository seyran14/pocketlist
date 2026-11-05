"use client"

import { useT } from "@/components/I18nProvider"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

const WIDTH = 600
const HEIGHT = 180

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const t = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d")
    if (!context) return
    context.lineWidth = 3
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = "#101828"
  }, [])

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * WIDTH, y: ((e.clientY - rect.top) / rect.height) * HEIGHT }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = point(e)
    const context = e.currentTarget.getContext("2d")!
    context.beginPath()
    context.moveTo(x, y)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const { x, y } = point(e)
    const context = e.currentTarget.getContext("2d")!
    context.lineTo(x, y)
    context.stroke()
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    drawing.current = false
    setEmpty(false)
    onChange(e.currentTarget.toDataURL("image/png"))
  }

  function clear() {
    const canvas = canvasRef.current!
    canvas.getContext("2d")!.clearRect(0, 0, WIDTH, HEIGHT)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div className="space-y-1">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        aria-label={t("Draw your signature")}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="h-36 w-full touch-none rounded-lg border bg-white"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t("Sign with your finger or mouse.")}</p>
        <Button type="button" variant="ghost" size="sm" disabled={empty} onClick={clear}>{t("Clear")}</Button>
      </div>
    </div>
  )
}
