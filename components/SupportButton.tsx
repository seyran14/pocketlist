"use client"

import { useState } from "react"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LifeBuoy, Mail } from "lucide-react"

export function SupportButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !message.trim()) return
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Something went wrong. Please try again.")
        setSending(false)
        return
      }
      posthog.capture("support_message_sent")
      setSent(true)
    } catch {
      setError("Something went wrong. Please try again.")
    }
    setSending(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // reset after the close animation
      setTimeout(() => {
        setSent(false)
        setEmail("")
        setMessage("")
        setError("")
      }, 200)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-sm text-muted-foreground gap-1.5"
        onClick={() => setOpen(true)}
      >
        <LifeBuoy size={15} />
        <span className="hidden sm:inline">Support</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{sent ? "Thank you!" : "Contact support"}</DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="check-circle-animate w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="check-path-animate"
                  />
                </svg>
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-sm font-medium">Message sent!</p>
                <p className="text-xs text-muted-foreground">We&apos;ll get back to you by email shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Have a question, an issue, or a suggestion for the site? Drop us a line — we read every message.
              </p>

              {/* Email — required */}
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Your email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Message — required */}
              <Textarea
                placeholder="What's on your mind? Concerns or suggestions for the site…"
                className="resize-none text-sm"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={sending || !email || !message.trim()}>
                {sending ? "Sending…" : "Send message →"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
