"use client"

import { useT } from "@/components/I18nProvider"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TermsModal } from "@/components/TermsModal"
import { registerAction } from "@/lib/actions/auth"

// What happens after this form, not the whole guide: the account itself is being created here.
const NEXT_STEPS = {
  owner: [
    "We email you a 6-digit code to sign in.",
    "Add your home with its title deed, rent and photos.",
    "Our team checks the title deed, then your listing goes live.",
  ],
  tenant: [
    "We email you a 6-digit code to sign in.",
    "Save the homes you like and ask owners for their contact details.",
    "Agree the terms with the owner and sign the contract on screen.",
  ],
} as const

export function RegisterForm({ initialRole = "BUYER" }: { initialRole?: "BUYER" | "AGENT" }) {
  const t = useT()
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [role, setRole] = useState<"BUYER" | "AGENT">(initialRole)
  const guideRole = role === "AGENT" ? "owner" : "tenant"

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <form action={registerAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("Email address")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>{t("I am…")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              id="role-buyer"
              value="BUYER"
              title={t("Looking to rent")}
              description={t("Browse listings and contact owners")}
              checked={role === "BUYER"}
              onSelect={setRole}
            />
            <RoleCard
              id="role-owner"
              value="AGENT"
              title={t("Property owner")}
              description={t("List your property and get contacted by tenants")}
              checked={role === "AGENT"}
              onSelect={setRole}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">{t("What happens next")}</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            {NEXT_STEPS[guideRole].map((step) => <li key={step}>{t(step)}</li>)}
          </ol>
          <Link href={`/guide?role=${guideRole}`} target="_blank" className="mt-3 inline-block text-sm underline underline-offset-4">
            {t("Read the guide")}
          </Link>
        </div>

        {/* Terms checkbox */}
        {/* The row is at least 44px tall and the checkbox's hit area reaches past its 16px box. */}
        <div className="flex min-h-11 items-start gap-3 py-2">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            className="relative mt-0.5 after:absolute after:-inset-3 after:content-['']"
          />
          <label htmlFor="terms" className="flex-1 text-sm text-muted-foreground leading-snug cursor-pointer select-none">
            {t("I agree to the")}{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              {t("Terms of Service and Privacy Policy")}
            </button>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={!agreed}>
          {t("Continue")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        {t("Already have an account?")}{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          {t("Sign in")}
        </Link>
      </p>
    </>
  )
}

function RoleCard({
  id, value, title, description, checked, onSelect,
}: {
  id: string; value: "BUYER" | "AGENT"
  title: string; description: string; checked: boolean
  onSelect: (value: "BUYER" | "AGENT") => void
}) {
  return (
    <label
      htmlFor={id}
      className="relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 has-[:checked]:border-foreground has-[:checked]:bg-muted/30"
    >
      <input
        type="radio"
        id={id}
        name="role"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span className="font-semibold text-sm mb-1">{title}</span>
      <span className="text-xs text-muted-foreground leading-snug">{description}</span>
    </label>
  )
}
