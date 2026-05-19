"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Heart, Phone, Link2, ChevronLeft,
  Mail, MessageCircle, Send as TelegramIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn, formatPrice, formatArea, formatBeds, daysAgo } from "@/lib/utils"

type Agent = { id: string; name: string | null }

type FeedListing = {
  id: string
  projectName: string
  title: string
  location: string
  subLocation: string | null
  bedrooms: string
  bathrooms: string | null
  price: number
  priceLabel: string | null
  propertyType: string
  areaSqft: number | null
  areaSqm: number | null
  floor: string | null
  view: string | null
  furnished: string | null
  handover: string | null
  isDistress: boolean
  originalPrice: number | null
  isRented: boolean
  rentAmount: number | null
  parkingSpots: number | null
  description: string | null
  status: string
  listingType: string
  createdAt: string
  agent: Agent
}

type ContactInfo = {
  name: string | null
  phone?: string | null
  whatsapp?: string | null
  telegram?: string | null
  email?: string | null
}

type Props = {
  listings: FeedListing[]
  savedIds: string[]
  isLoggedIn: boolean
}

function telegramHref(value: string): string {
  const clean = value.trim().replace(/^@/, "")
  if (/^[\d+]/.test(value.trim())) return `https://t.me/+${clean.replace(/\D/g, "")}`
  return `https://t.me/${clean}`
}

function FieldRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function SideBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
    >
      <div className={cn(
        "w-11 h-11 rounded-full border bg-background flex items-center justify-center shadow-sm",
        active && "border-red-400",
      )}>
        {icon}
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  )
}

export function FeedClient({ listings, savedIds, isLoggedIn }: Props) {
  const router = useRouter()
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set(savedIds))
  const [contactOpen, setContactOpen] = useState(false)
  const [contactListingId, setContactListingId] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [inquiryEmail, setInquiryEmail] = useState("")
  const [inquiryName, setInquiryName] = useState("")
  const [inquiryMsg, setInquiryMsg] = useState("")
  const [inquirySending, setInquirySending] = useState(false)
  const [inquirySent, setInquirySent] = useState(false)

  async function toggleSave(listingId: string) {
    if (!isLoggedIn) { router.push("/login"); return }
    const wasSaved = savedSet.has(listingId)
    setSavedSet((s) => {
      const next = new Set(s)
      wasSaved ? next.delete(listingId) : next.add(listingId)
      return next
    })
    const res = await fetch(`/api/listings/${listingId}/save`, { method: "POST" })
    if (!res.ok) {
      setSavedSet((s) => {
        const next = new Set(s)
        wasSaved ? next.add(listingId) : next.delete(listingId)
        return next
      })
    }
  }

  async function openContact(listingId: string) {
    setContactListingId(listingId)
    setContactInfo(null)
    setInquirySent(false)
    setInquiryEmail("")
    setInquiryName("")
    setInquiryMsg("")
    setContactOpen(true)
    if (!isLoggedIn) return
    setContactLoading(true)
    const res = await fetch(`/api/listings/${listingId}/contact`)
    if (res.ok) setContactInfo(await res.json())
    setContactLoading(false)
  }

  async function copyLink(listingId: string) {
    const url = `${window.location.origin}/listings/${listingId}`
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
    setCopiedId(listingId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!contactListingId || !inquiryEmail) return
    setInquirySending(true)
    await fetch(`/api/listings/${contactListingId}/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inquiryEmail, name: inquiryName, message: inquiryMsg }),
    })
    setInquirySending(false)
    setInquirySent(true)
  }

  const hasContactInfo = contactInfo && (
    contactInfo.phone || contactInfo.whatsapp || contactInfo.telegram || contactInfo.email
  )

  return (
    <>
      {/* Feed container */}
      <div
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory overscroll-none"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {listings.map((l) => {
          const isSaved = savedSet.has(l.id)
          const isCopied = copiedId === l.id

          return (
            <div
              key={l.id}
              className="h-[100dvh] snap-start snap-always flex bg-background overflow-hidden"
            >
              {/* Main scrollable content */}
              <div className="flex-1 overflow-y-auto min-w-0">
                {/* Top bar */}
                <div
                  className="flex items-center gap-2 px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border"
                >
                  <Link
                    href={`/listings/${l.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </Link>
                  <span className="text-sm font-medium truncate flex-1">{l.projectName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{daysAgo(new Date(l.createdAt))}</span>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {l.status === "RESERVED" && <Badge variant="secondary">Under Offer</Badge>}
                    {l.isDistress && <Badge variant="destructive">Distress Deal</Badge>}
                  </div>

                  {/* Title */}
                  <div>
                    <h1 className="text-xl font-bold leading-snug">
                      {l.title || `${formatBeds(l.bedrooms)} in ${l.location}`}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {l.projectName}
                      {l.subLocation && ` · ${l.subLocation}`}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-2xl font-bold">
                      {l.priceLabel ?? formatPrice(l.price)}
                    </p>
                    {l.isDistress && l.originalPrice && (
                      <p className="text-sm text-muted-foreground line-through mt-0.5">
                        OP: {formatPrice(l.originalPrice)}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Field rows */}
                  <div className="rounded-lg border bg-card px-3">
                    <FieldRow label="Location" value={l.location} />
                    <FieldRow label="Property type" value={l.propertyType.charAt(0) + l.propertyType.slice(1).toLowerCase()} />
                    <FieldRow label="Bedrooms" value={formatBeds(l.bedrooms)} />
                    <FieldRow label="Bathrooms" value={l.bathrooms} />
                    <FieldRow label="Area" value={formatArea(l.areaSqft, l.areaSqm)} />
                    <FieldRow label="Floor" value={l.floor ? l.floor.charAt(0) + l.floor.slice(1).toLowerCase() + " floor" : null} />
                    <FieldRow label="View" value={l.view} />
                    <FieldRow label="Furnished" value={l.furnished ? l.furnished.charAt(0) + l.furnished.slice(1).toLowerCase() : null} />
                    <FieldRow label="Handover" value={l.handover} />
                    <FieldRow label="Parking" value={l.parkingSpots ? `${l.parkingSpots} spot${l.parkingSpots > 1 ? "s" : ""}` : null} />
                    {l.isRented && <FieldRow label="Rental income" value={l.rentAmount ? formatPrice(l.rentAmount) + "/yr" : "Rented"} />}
                  </div>

                  {/* Description */}
                  {l.description && (
                    <div>
                      <h2 className="font-semibold mb-1.5 text-sm">Notes</h2>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{l.description}</p>
                    </div>
                  )}

                  {/* Agent */}
                  <div className="rounded-xl border bg-card p-3">
                    <Link href={`/agents/${l.agent.id}`} className="font-medium text-sm hover:underline underline-offset-4">
                      {l.agent.name ?? "Agent"}
                    </Link>
                    <p className="text-xs text-muted-foreground">Agent</p>
                  </div>

                  {/* Bottom spacer so last content isn't hidden behind bottom padding */}
                  <div style={{ height: "env(safe-area-inset-bottom, 16px)" }} />
                </div>
              </div>

              {/* Right icon column */}
              <div
                className="w-16 shrink-0 flex flex-col items-center justify-center gap-6 border-l border-border bg-background"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <SideBtn
                  icon={
                    <Heart
                      size={20}
                      className={cn("transition-colors", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground")}
                    />
                  }
                  label="Save"
                  active={isSaved}
                  onClick={() => toggleSave(l.id)}
                />
                <SideBtn
                  icon={<Phone size={20} className="text-muted-foreground" />}
                  label="Contact"
                  onClick={() => openContact(l.id)}
                />
                <SideBtn
                  icon={
                    <Link2
                      size={20}
                      className={cn("transition-colors", isCopied ? "text-green-500" : "text-muted-foreground")}
                    />
                  }
                  label={isCopied ? "Copied!" : "Share"}
                  onClick={() => copyLink(l.id)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Contact dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isLoggedIn ? (contactInfo?.name ?? "Agent Contact") : "Leave your details"}
            </DialogTitle>
          </DialogHeader>

          {isLoggedIn ? (
            contactLoading ? (
              <p className="text-sm text-muted-foreground py-2">Loading…</p>
            ) : hasContactInfo ? (
              <div className="flex flex-col gap-2">
                {contactInfo!.phone && (
                  <a href={`tel:${contactInfo!.phone}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Phone size={16} className="shrink-0 text-zinc-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{contactInfo!.phone}</p>
                    </div>
                  </a>
                )}
                {contactInfo!.whatsapp && (
                  <a href={`https://wa.me/${contactInfo!.whatsapp.replace(/\D/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <MessageCircle size={16} className="shrink-0 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="text-sm font-medium">{contactInfo!.whatsapp}</p>
                    </div>
                  </a>
                )}
                {contactInfo!.telegram && (
                  <a href={telegramHref(contactInfo!.telegram)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <TelegramIcon size={16} className="shrink-0 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telegram</p>
                      <p className="text-sm font-medium">{contactInfo!.telegram}</p>
                    </div>
                  </a>
                )}
                {contactInfo!.email && (
                  <a href={`mailto:${contactInfo!.email}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Mail size={16} className="shrink-0 text-zinc-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{contactInfo!.email}</p>
                    </div>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No contact info available.</p>
            )
          ) : inquirySent ? (
            <div className="py-4 text-center space-y-1">
              <p className="text-sm font-medium">Sent!</p>
              <p className="text-sm text-muted-foreground">The agent will reach out to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={sendInquiry} className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground">The agent will contact you via email.</p>
              <p className="text-sm text-muted-foreground -mt-1">
                To view contact details directly,{" "}
                <a href="/login" className="underline underline-offset-4 text-foreground">sign in</a>.
              </p>
              <Input placeholder="Your email" type="email" required
                value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} />
              <Input placeholder="Your name (optional)"
                value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} />
              <Textarea placeholder="Message (optional)" className="resize-none text-sm" rows={3}
                value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} />
              <Button type="submit" className="w-full" disabled={inquirySending || !inquiryEmail}>
                {inquirySending ? "Sending…" : "Send to agent →"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
