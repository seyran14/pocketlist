"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "lucide-react"

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement("textarea")
      el.value = url
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" className="w-full" onClick={handleClick}>
      <Link className="w-4 h-4 mr-2" />
      {copied ? "Copied!" : "Copy link"}
    </Button>
  )
}
