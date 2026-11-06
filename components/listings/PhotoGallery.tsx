"use client"

import { useT } from "@/components/I18nProvider"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Dialog } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { photoUrl } from "@/lib/photos-shared"

function PhotoViewer({ photos, alt, start, onClose }: {
  photos: { id: string }[]
  alt: string
  start: number
  onClose: (index: number) => void
}) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(start)

  useEffect(() => {
    const track = trackRef.current
    if (track) track.scrollLeft = start * track.clientWidth
  }, [start])

  function goTo(index: number) {
    const track = trackRef.current
    if (track && index >= 0 && index < photos.length) {
      track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" })
    }
  }

  const control = "absolute z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition-[background-color,opacity] hover:bg-white/30 disabled:opacity-0"

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(active) }}>
      <Dialog.Portal>
        <Dialog.Popup
          dir="ltr"
          aria-label={alt}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") goTo(active - 1)
            if (e.key === "ArrowRight") goTo(active + 1)
          }}
          className="fixed inset-0 z-[60] bg-black outline-none"
        >
          <div
            ref={trackRef}
            onScroll={(e) => {
              const { scrollLeft, clientWidth } = e.currentTarget
              setActive(Math.round(scrollLeft / clientWidth))
            }}
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((p, i) => (
              <div key={p.id} className="relative h-full w-full shrink-0 snap-center">
                <Image
                  src={photoUrl(p.id)}
                  alt={`${alt}, photo ${i + 1} of ${photos.length}`}
                  fill
                  unoptimized
                  loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          <Dialog.Close aria-label={t("Close")} className={cn(control, "end-3 top-[max(0.75rem,env(safe-area-inset-top))]")}>
            <X size={20} />
          </Dialog.Close>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                disabled={active === 0}
                aria-label={t("Previous photo")}
                className={cn(control, "start-3 top-1/2 hidden -translate-y-1/2 sm:flex")}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                disabled={active === photos.length - 1}
                aria-label={t("Next photo")}
                className={cn(control, "end-3 top-1/2 hidden -translate-y-1/2 sm:flex")}
              >
                <ChevronRight size={20} />
              </button>
              <span className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-sm font-medium text-white tabular-nums">
                {active + 1} / {photos.length}
              </span>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function PhotoGallery({ photos, alt }: { photos: { id: string }[]; alt: string }) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [viewing, setViewing] = useState(false)

  if (photos.length === 0) return null

  function goTo(index: number) {
    const track = trackRef.current
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" })
  }

  const multiple = photos.length > 1

  return (
    <div dir="ltr" className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        <div
          ref={trackRef}
          onScroll={(e) => {
            const { scrollLeft, clientWidth } = e.currentTarget
            setActive(Math.round(scrollLeft / clientWidth))
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setViewing(true)}
              aria-label={t("Open photo {n} full size", { n: i + 1 })}
              className="relative aspect-[4/3] w-full shrink-0 cursor-zoom-in snap-center"
            >
              <Image
                src={photoUrl(p.id)}
                alt={`${alt}, photo ${i + 1} of ${photos.length}`}
                fill
                unoptimized
                loading={i === 0 ? "eager" : "lazy"}
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label={t("Previous photo")}
              className="absolute start-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-0 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === photos.length - 1}
              aria-label={t("Next photo")}
              className="absolute end-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-0 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-2 end-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-opacity",
                i === active ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={photoUrl(p.id, "thumb")} alt="" fill unoptimized loading="lazy" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <PhotoViewer
          photos={photos}
          alt={alt}
          start={active}
          onClose={(index) => {
            setViewing(false)
            const track = trackRef.current
            if (track) track.scrollLeft = index * track.clientWidth
          }}
        />
      )}
    </div>
  )
}
