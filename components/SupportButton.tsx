"use client"

import { useT } from "@/components/I18nProvider"
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
import { SUPPORT_EMAIL } from "@/lib/utils"

export function SupportButton({ row = false }: { row?: boolean }) {
  const t = useT()
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
        setError(data?.error ?? t("Something went wrong. Please try again."))
        setSending(false)
        return
      }
      posthog.capture("support_message_sent")
      setSent(true)
    } catch {
      setError(t("Something went wrong. Please try again."))
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
        className={row ? "w-full justify-start gap-2" : "text-sm text-muted-foreground gap-1.5"}
        onClick={() => setOpen(true)}
      >
        {!row && <LifeBuoy size={15} />}
        <span className={row ? undefined : "hidden sm:inline"}>{t("Support")}</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{sent ? t("Thank you!") : t("Contact support")}</DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="check-circle-animate w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary-foreground" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-sm font-medium">{t("Message sent!")}</p>
                <p className="text-xs text-muted-foreground">{t("We'll get back to you by email shortly.")}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("Write to us about a question, a problem or an idea for the site. A person reads every message.")}
              </p>

              {/* Email — required */}
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={t("Your email")}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Message — required */}
              <Textarea
                placeholder={t("What's on your mind? Concerns or suggestions for the site…")}
                className="resize-none text-sm"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={sending || !email || !message.trim()}>
                {sending ? t("Sending…") : t("Send message")}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("Or email us at")}{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
