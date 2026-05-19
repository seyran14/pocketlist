"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Phone, Mail, MessageCircle, Send } from "lucide-react"

type Props = {
  listingId: string
  isLoggedIn: boolean
}

type ContactInfo = {
  name: string | null
  phone?: string | null
  whatsapp?: string | null
  telegram?: string | null
  email?: string | null
}

function telegramHref(value: string): string {
  const clean = value.trim().replace(/^@/, "")
  if (/^[\d+]/.test(value.trim())) {
    return `https://t.me/+${clean.replace(/\D/g, "")}`
  }
  return `https://t.me/${clean}`
}

function ContactRow({ icon, label, value, href, external, colorClass }: {
  icon: React.ReactNode; label: string; value: string
  href: string; external?: boolean; colorClass: string
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
    >
      <span className={`shrink-0 ${colorClass}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </a>
  )
}

export function ContactButton({ listingId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [inquiryEmail, setInquiryEmail] = useState("")
  const [inquiryName, setInquiryName] = useState("")
  const [inquiryMsg, setInquiryMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReveal() {
    setOpen(true)
    if (!isLoggedIn || contact) return
    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}/contact`)
    if (res.status === 429) {
      setContact({ name: "__limit__" })
    } else if (res.ok) {
      setContact(await res.json())
    }
    setLoading(false)
  }

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!inquiryEmail) return
    setSending(true)
    await fetch(`/api/listings/${listingId}/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inquiryEmail, name: inquiryName, message: inquiryMsg }),
    })
    setSending(false)
    setSent(true)
  }

  const hasAny = contact && (contact.phone || contact.whatsapp || contact.telegram || contact.email)

  return (
    <>
      <Button className="w-full" onClick={handleReveal}>
        {isLoggedIn ? "Show Contact" : "Request Contact"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isLoggedIn ? (contact?.name ?? "Agent Contact") : "Leave your details"}
            </DialogTitle>
          </DialogHeader>

          {isLoggedIn ? (
            loading ? (
              <p className="text-sm text-muted-foreground py-2">Loading…</p>
            ) : hasAny ? (
              <div className="flex flex-col gap-2">
                {contact.phone && (
                  <ContactRow icon={<Phone size={16} />} label="Phone" value={contact.phone}
                    href={`tel:${contact.phone}`} colorClass="text-zinc-500" />
                )}
                {contact.whatsapp && (
                  <ContactRow icon={<MessageCircle size={16} />} label="WhatsApp" value={contact.whatsapp}
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} external colorClass="text-green-600" />
                )}
                {contact.telegram && (
                  <ContactRow icon={<Send size={16} />} label="Telegram" value={contact.telegram}
                    href={telegramHref(contact.telegram)} external colorClass="text-blue-500" />
                )}
                {contact.email && (
                  <ContactRow icon={<Mail size={16} />} label="Email" value={contact.email}
                    href={`mailto:${contact.email}`} colorClass="text-zinc-500" />
                )}
              </div>
            ) : contact?.name === "__limit__" ? (
              <p className="text-sm text-muted-foreground py-2">
                You&apos;ve reached the daily limit (20 contacts). Try again tomorrow.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Could not load contact info.</p>
            )
          ) : sent ? (
            <div className="py-4 text-center space-y-1">
              <p className="text-sm font-medium">Sent!</p>
              <p className="text-sm text-muted-foreground">The agent will reach out to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground">
                The agent will contact you via email.
              </p>
              <p className="text-sm text-muted-foreground -mt-1">
                To view the agent&apos;s contact details directly,{" "}
                <a href="/login" className="underline underline-offset-4 text-foreground hover:opacity-70">
                  sign up or log in
                </a>
                .
              </p>
              <Input placeholder="Your email" type="email" required
                value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} />
              <Input placeholder="Your name (optional)"
                value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} />
              <Textarea placeholder="Message (optional)" className="resize-none text-sm" rows={3}
                value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} />
              <Button type="submit" className="w-full" disabled={sending || !inquiryEmail}>
                {sending ? "Sending…" : "Send to agent →"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
