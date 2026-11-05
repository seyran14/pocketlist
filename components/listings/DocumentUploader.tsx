"use client"

import { useT } from "@/components/I18nProvider"
import { useRef, useState } from "react"
import { Check, FileUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DeedFields } from "@/lib/deed-shared"
import type { DocumentKind } from "@/lib/documents-shared"
import { MAX_PHOTO_BYTES, MAX_PHOTO_MB } from "@/lib/photos-shared"

export type UploadedDocument = {
  id: string
  fileName: string
  fields?: DeedFields | null
  hasText?: boolean
}

type Props = {
  kind: DocumentKind
  label: string
  hint: string
  current: { fileName: string } | null
  showError?: boolean
  accept?: string
  onUploaded: (document: UploadedDocument) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function DocumentUploader({ kind, label, hint, current, showError, accept, onUploaded, onUploadingChange }: Props) {
  const t = useT()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(t("{name} is larger than {mb} MB.", { name: file.name, mb: MAX_PHOTO_MB }))
      return
    }
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("kind", kind)
      const res = await fetch("/api/documents", { method: "POST", body })
      const data = await res.json().catch(() => ({}))
      if (res.ok) onUploaded(data)
      else toast.error(data.error ?? t("Upload failed"))
    } catch {
      toast.error(t("Network error. Please try again."))
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div className={cn("rounded-lg border p-3", showError && !current && "border-destructive")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t(label)}</p>
          {current ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check size={12} className="shrink-0 text-green-600" />
              <span className="truncate">{current.fileName}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t(hint)}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <FileUp size={14} className="me-1" />
          {uploading ? t("Uploading…") : current ? t("Replace") : t("Upload")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? "application/pdf,image/*,.heic,.heif"}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) upload(file)
        }}
      />
    </div>
  )
}
