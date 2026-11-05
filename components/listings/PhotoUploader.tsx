"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Star, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MAX_PHOTOS_PER_LISTING, MAX_PHOTO_BYTES, MAX_PHOTO_MB, photoUrl } from "@/lib/photos-shared"

type Props = {
  initialIds: string[]
  onChange: (ids: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function PhotoUploader({ initialIds, onChange, onUploadingChange }: Props) {
  const [ids, setIds] = useState(initialIds)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploading = progress !== null

  useEffect(() => {
    onChange(ids)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])

  // Cleanup also fires if the unit is removed mid-upload, so publish can't stay locked.
  useEffect(() => {
    if (!uploading) return
    onUploadingChange?.(true)
    return () => onUploadingChange?.(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading])

  async function upload(files: File[]) {
    const room = MAX_PHOTOS_PER_LISTING - ids.length
    if (files.length > room) {
      toast.error(`You can add ${room} more photo${room !== 1 ? "s" : ""} (${MAX_PHOTOS_PER_LISTING} max).`)
    }
    const batch = files.slice(0, room)
    if (batch.length === 0) return

    // One at a time keeps memory flat on the server while it resizes.
    setProgress({ done: 0, total: batch.length })
    for (const [i, file] of batch.entries()) {
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(`${file.name} is larger than ${MAX_PHOTO_MB} MB.`)
      } else {
        const body = new FormData()
        body.append("file", file)
        try {
          const res = await fetch("/api/photos", { method: "POST", body })
          const data = await res.json().catch(() => ({}))
          if (res.ok) setIds((prev) => [...prev, data.id])
          else toast.error(`${file.name}: ${data.error ?? "upload failed"}`)
        } catch {
          toast.error(`${file.name}: network error`)
        }
      }
      setProgress({ done: i + 1, total: batch.length })
    }
    setProgress(null)
  }

  function remove(id: string) {
    setIds((prev) => prev.filter((p) => p !== id))
  }

  function makeCover(id: string) {
    setIds((prev) => [id, ...prev.filter((p) => p !== id)])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">Photos</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {ids.length} / {MAX_PHOTOS_PER_LISTING}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {ids.map((id, i) => (
          <div key={id} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <Image src={photoUrl(id, "thumb")} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover" />
            {i === 0 ? (
              <span className="absolute left-1 bottom-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(id)}
                aria-label={`Make photo ${i + 1} the cover`}
                title="Make cover"
                className="absolute left-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <Star size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(id)}
              aria-label={`Remove photo ${i + 1}`}
              title="Remove"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {ids.length < MAX_PHOTOS_PER_LISTING && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors",
              uploading ? "cursor-wait" : "hover:border-foreground/40 hover:text-foreground"
            )}
          >
            <ImagePlus size={20} />
            <span className="px-1 text-center text-xs tabular-nums">
              {progress ? `${progress.done} of ${progress.total}` : "Add photos"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ""
          upload(files)
        }}
      />

      <p className="text-xs text-muted-foreground">
        JPG, PNG, HEIC, WebP and other photo formats, up to {MAX_PHOTO_MB} MB each. The first photo is the cover.
      </p>
    </div>
  )
}
