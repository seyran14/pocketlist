"use client"

import { useState } from "react"
import { Popover } from "@base-ui/react/popover"
import { Share } from "lucide-react"
import { useT } from "@/components/I18nProvider"
import { Button } from "@/components/ui/button"

// Sharing is secondary to contacting the owner, so it folds into one button. Phones get the
// system share sheet; elsewhere a small menu offers the link and the two apps Dubai uses most.
export function ShareMenu({ title, url, iconOnly = false }: { title: string; url: string; iconOnly?: boolean }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const text = `${title}\n${url}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Older browsers and some in-app views refuse the clipboard API.
      const field = document.createElement("textarea")
      field.value = url
      field.style.position = "fixed"
      field.style.opacity = "0"
      document.body.appendChild(field)
      field.select()
      document.execCommand("copy")
      field.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function nativeShare(e: React.MouseEvent) {
    if (!navigator.share || !window.matchMedia("(pointer: coarse)").matches) return
    e.preventDefault()
    try {
      await navigator.share({ title, url })
    } catch {
      // Closing the share sheet rejects; nothing to do.
    }
  }

  const item = "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"

  return (
    <Popover.Root>
      <Popover.Trigger
        render={iconOnly
          ? <Button variant="outline" size="icon" className="shrink-0 max-sm:size-11" aria-label={t("Share")} onClick={nativeShare} />
          : <Button variant="outline" className="flex-1" onClick={nativeShare} />}
      >
        <Share aria-hidden="true" />
        {!iconOnly && t("Share")}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end" className="z-50">
          <Popover.Popup className="w-56 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-pop outline-none transition-[opacity,transform] duration-150 ease-out-soft data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <button type="button" onClick={copy} className={item}>
              {copied ? t("Copied!") : t("Copy link")}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={item}>
              WhatsApp
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className={item}>
              Telegram
            </a>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
