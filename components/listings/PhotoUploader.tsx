"use client"

import { useT } from "@/components/I18nProvider"
import { useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import {
  DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ImagePlus, Star, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MAX_PHOTOS_PER_LISTING, MAX_PHOTO_BYTES, MAX_PHOTO_MB, photoUrl } from "@/lib/photos-shared"

type Props = {
  initialIds: string[]
  onChange: (ids: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
  canUpload?: boolean
}

function PhotoTile({ id, index, onCover, onRemove }: {
  id: string
  index: number
  onCover: () => void
  onRemove: () => void
}) {
  const t = useT()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "relative aspect-square cursor-grab touch-manipulation overflow-hidden rounded-lg border bg-muted select-none [-webkit-touch-callout:none]",
        isDragging && "z-10 cursor-grabbing opacity-90 shadow-pop ring-2 ring-foreground"
      )}
    >
      <Image src={photoUrl(id, "thumb")} alt={`Photo ${index + 1}`} fill unoptimized draggable={false} className="pointer-events-none object-cover" />
      {index === 0 ? (
        <span className="absolute start-1 bottom-1 rounded scrim px-1.5 py-0.5 text-[10px] font-medium text-white max-sm:text-xs">
          {t("Cover")}
        </span>
      ) : (
        <button
          type="button"
          onClick={onCover}
          aria-label={`Make photo ${index + 1} the cover`}
          title={t("Make cover")}
          className="absolute start-1 bottom-1 flex size-7 items-center justify-center rounded-full scrim text-white hover:opacity-80 max-sm:size-9"
        >
          <Star size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove photo ${index + 1}`}
        title={t("Remove")}
        className="absolute end-1 top-1 flex size-7 items-center justify-center rounded-full scrim text-white hover:opacity-80 max-sm:size-9"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function PhotoUploader({ initialIds, onChange, onUploadingChange, canUpload = true }: Props) {
  const t = useT()
  const [ids, setIds] = useState(initialIds)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploading = progress !== null
  const dndId = useId()
  // A touch has to hold still first, so swiping over the photos still scrolls the page.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
      toast.error(t("Photos you can still add: {room}, out of {max}.", { room, max: MAX_PHOTOS_PER_LISTING }))
    }
    const batch = files.slice(0, room)
    if (batch.length === 0) return

    // One at a time keeps memory flat on the server while it resizes.
    setProgress({ done: 0, total: batch.length })
    for (const [i, file] of batch.entries()) {
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(t("{name} is larger than {mb} MB.", { name: file.name, mb: MAX_PHOTO_MB }))
      } else {
        const body = new FormData()
        body.append("file", file)
        try {
          const res = await fetch("/api/photos", { method: "POST", body })
          const data = await res.json().catch(() => ({}))
          if (res.ok) setIds((prev) => [...prev, data.id])
          else toast.error(`${file.name}: ${data.error ?? "upload failed"}`)
        } catch {
          toast.error(`${file.name}: ${t("Network error. Please try again.")}`)
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

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setIds((prev) => arrayMove(prev, prev.indexOf(String(active.id)), prev.indexOf(String(over.id))))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t("Photos")}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {ids.length} / {MAX_PHOTOS_PER_LISTING}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            {ids.map((id, i) => (
              <PhotoTile key={id} id={id} index={i} onCover={() => makeCover(id)} onRemove={() => remove(id)} />
            ))}
          </SortableContext>
        </DndContext>
        {canUpload && ids.length < MAX_PHOTOS_PER_LISTING && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground",
              uploading ? "cursor-wait" : "hover:border-foreground/40 hover:text-foreground"
            )}
          >
            <ImagePlus size={20} />
            <span className="px-1 text-center text-xs tabular-nums">
              {progress ? t("{done} of {total}", progress) : t("Add photos")}
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

      {ids.length > 1 && (
        <p className="text-xs text-muted-foreground">{t("Hold a photo and drag it to change the order.")}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("JPG, PNG, HEIC, WebP and other photo formats, up to {mb} MB each. The first photo is the cover.", { mb: MAX_PHOTO_MB })}
      </p>
    </div>
  )
}
