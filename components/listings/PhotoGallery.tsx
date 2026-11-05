"use client"

import { useT } from "@/components/I18nProvider"
import { useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { photoUrl } from "@/lib/photos-shared"

export function PhotoGallery({ photos, alt }: { photos: { id: string }[]; alt: string }) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

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
            <div key={p.id} className="relative aspect-[4/3] w-full shrink-0 snap-center">
              <Image
                src={photoUrl(p.id)}
                alt={`${alt}, photo ${i + 1} of ${photos.length}`}
                fill
                unoptimized
                loading={i === 0 ? "eager" : "lazy"}
                className="object-cover"
              />
            </div>
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
    </div>
  )
}
