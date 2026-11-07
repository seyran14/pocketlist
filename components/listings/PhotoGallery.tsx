"use client"

import { useT } from "@/components/I18nProvider"
import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Dialog } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { animate, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { spring } from "@/lib/motion"
import { photoUrl } from "@/lib/photos-shared"

// Swipes stay native (scroll-snap keeps the platform's momentum). Buttons and thumbnails
// move the track on a spring instead of the browser's fixed smooth-scroll curve.
function springScroll(track: HTMLElement, index: number, reduced: boolean) {
  const target = index * track.clientWidth
  if (reduced) {
    track.scrollLeft = target
    return
  }
  // Snapping would fight each frame of the spring, so it pauses until the track lands.
  track.style.scrollSnapType = "none"
  animate(track.scrollLeft, target, {
    ...spring,
    onUpdate: (left) => { track.scrollLeft = left },
    onComplete: () => { track.style.scrollSnapType = "" },
  })
}

function PhotoViewer({ photos, alt, start, onClose }: {
  photos: { id: string }[]
  alt: string
  start: number
  onClose: (index: number) => void
}) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(start)
  const reduced = useReducedMotion()

  // The dialog mounts its content later than this component, so an effect here finds no track.
  const placeTrack = useCallback((track: HTMLDivElement | null) => {
    trackRef.current = track
    if (track) track.scrollLeft = start * track.clientWidth
  }, [start])

  function goTo(index: number) {
    const track = trackRef.current
    if (track && index >= 0 && index < photos.length) springScroll(track, index, !!reduced)
  }

  const control = "scrim-light absolute z-10 flex size-10 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80 disabled:opacity-0"

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
          className="fixed inset-0 z-[60] outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="absolute inset-0 bg-black"
          >
          <div
            ref={placeTrack}
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
              <span className="scrim absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 rounded px-2 py-0.5 text-sm font-medium text-white tabular-nums">
                {active + 1} / {photos.length}
              </span>
            </>
          )}
          </motion.div>
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
  const reduced = useReducedMotion()

  if (photos.length === 0) return null

  function goTo(index: number) {
    const track = trackRef.current
    if (track) springScroll(track, index, !!reduced)
  }

  const multiple = photos.length > 1

  return (
    <div dir="ltr" className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl bg-muted">
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
              className="absolute start-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center scrim rounded-full text-white ring-1 ring-white/50 transition-opacity hover:opacity-80 disabled:opacity-0 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === photos.length - 1}
              aria-label={t("Next photo")}
              className="absolute end-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center scrim rounded-full text-white ring-1 ring-white/50 transition-opacity hover:opacity-80 disabled:opacity-0 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
            <span className="scrim absolute bottom-2 end-2 rounded px-2 sm:hidden py-0.5 text-xs font-medium text-white tabular-nums">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div className="hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative my-1 ms-1 h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-opacity",
                i === active ? "outline-2 outline-offset-2 outline-primary" : "opacity-70 hover:opacity-100"
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
