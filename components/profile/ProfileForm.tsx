"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  role: string
  phone: string | null
  whatsapp: string | null
  telegram: string | null
  contactPref: string | null
  reraNumber: string | null
}

type FormValues = {
  name: string
  phone: string
  whatsapp: string
  telegram: string
  reraNumber: string
}

const CONTACT_METHODS = [
  { key: "EMAIL", label: "Email" },
  { key: "PHONE", label: "Phone" },
  { key: "WHATSAPP", label: "WhatsApp" },
  { key: "TELEGRAM", label: "Telegram" },
] as const

function parsePrefs(pref: string | null): Set<string> {
  if (!pref) return new Set(["EMAIL"])
  return new Set(pref.split(",").map((s) => s.trim()).filter(Boolean))
}

export function ProfileForm({ user }: { user: ProfileData }) {
  const [prefs, setPrefs] = useState<Set<string>>(() => parsePrefs(user.contactPref))
  const [saving, setSaving] = useState(false)
  const isAgent = user.role === "AGENT"

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
      whatsapp: user.whatsapp ?? "",
      telegram: user.telegram ?? "",
      reraNumber: user.reraNumber ?? "",
    },
  })

  function togglePref(key: string) {
    setPrefs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function selectAll() {
    setPrefs(new Set(CONTACT_METHODS.map((m) => m.key)))
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    const contactPref = isAgent && prefs.size > 0
      ? [...prefs].join(",")
      : null
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, contactPref }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Profile saved")
    } else {
      toast.error("Failed to save profile")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Basic info
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user.email ?? ""}
            disabled
            className="text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Email is managed through your sign-in method.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Your full name"
          />
        </div>
      </div>

      {isAgent && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contact details
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Buyers see these when they click &quot;Show Contact&quot; on your listings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+123 456 7890"
                type="tel"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                {...register("whatsapp")}
                placeholder="+123 456 7890"
                type="tel"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                {...register("telegram")}
                placeholder="@username or +123 456 7890"
              />
              <p className="text-xs text-muted-foreground">Username or phone number</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>How buyers can reach you</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={selectAll}
              >
                All
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              {CONTACT_METHODS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`pref-${key}`}
                    checked={prefs.has(key)}
                    onCheckedChange={() => togglePref(key)}
                  />
                  <Label htmlFor={`pref-${key}`} className="text-sm cursor-pointer font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reraNumber">RERA number</Label>
            <Input
              id="reraNumber"
              {...register("reraNumber")}
              placeholder="e.g. 12345"
              className="w-48"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-32">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
