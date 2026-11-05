"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type OwnerContact = {
  name: string
  phone: string
  whatsapp: string
  telegram: string
}

const FIELDS = [
  { key: "name", label: "Your name", placeholder: "Shown on your listings", type: "text" },
  { key: "phone", label: "Phone", placeholder: "+971 50 123 4567", type: "tel" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "+971 50 123 4567", type: "tel" },
  { key: "telegram", label: "Telegram", placeholder: "@username", type: "text" },
] as const

export function hasRequiredContact(c: OwnerContact) {
  return !!(c.name.trim() && c.phone.trim())
}

export function OwnerContactCard({
  value,
  email,
  onChange,
  showError,
}: {
  value: OwnerContact
  email: string
  onChange: (value: OwnerContact) => void
  showError: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Your contact</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your name and phone are required. Buyers reach you directly, and this is saved to your profile for all your listings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="contact-email" className="text-xs text-muted-foreground">Email</Label>
          <Input id="contact-email" value={email} readOnly disabled className="h-8 text-sm mt-1" />
        </div>
        {FIELDS.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <Label htmlFor={`contact-${key}`} className="text-xs text-muted-foreground">{label}</Label>
            <Input
              id={`contact-${key}`}
              type={type}
              value={value[key]}
              placeholder={placeholder}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              className="h-8 text-sm mt-1"
            />
          </div>
        ))}
      </div>

      {showError && (
        <p role="alert" className="text-xs text-destructive">
          Add your name and phone number.
        </p>
      )}
    </div>
  )
}
