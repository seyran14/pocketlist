"use client"

import { useT } from "@/components/I18nProvider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LATIN_TEXT } from "@/lib/tenancy-shared"

export type OwnerContact = {
  name: string
  phone: string
  whatsapp: string
  telegram: string
}

const FIELDS = [
  { key: "name", label: "Your name", placeholder: "Name and surname as in your passport", type: "text" },
  { key: "phone", label: "Phone", placeholder: "+971 50 123 4567", type: "tel" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "+971 50 123 4567", type: "tel" },
  { key: "telegram", label: "Telegram", placeholder: "@username", type: "text" },
] as const

// Latin only, because the name is compared with the title deed.
export function hasRequiredContact(c: OwnerContact) {
  return !!(c.name.trim() && c.phone.trim()) && LATIN_TEXT.test(c.name)
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
  const t = useT()
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{t("Your contact")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("Your name and phone are required. Tenants reach you directly, and this is saved to your profile for all your listings.")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="contact-email" className="text-xs text-muted-foreground">{t("Email")}</Label>
          <Input id="contact-email" value={email} readOnly disabled className="h-8 text-sm mt-1" />
        </div>
        {FIELDS.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <Label htmlFor={`contact-${key}`} className="text-xs text-muted-foreground">{t(label)}</Label>
            <Input
              id={`contact-${key}`}
              type={type}
              value={value[key]}
              placeholder={t(placeholder)}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              className="h-8 text-sm mt-1"
            />
          </div>
        ))}
      </div>

      {showError && (
        <p role="alert" className="text-xs text-destructive">
          {LATIN_TEXT.test(value.name) ? t("Add your name and phone number.") : t("Write your name in English letters, as in your passport.")}
        </p>
      )}
    </div>
  )
}
