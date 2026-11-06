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
import { GUIDE } from "@/lib/guide"

export function RegisterForm() {
  const t = useT()
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [role, setRole] = useState<"BUYER" | "AGENT">("BUYER")
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
            placeholder="you@example.com"
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
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-muted-foreground">
            {GUIDE[guideRole].map((step) => <li key={step.title}>{t(step.title)}</li>)}
          </ol>
          <Link href={`/guide?role=${guideRole}`} target="_blank" className="mt-3 inline-block text-sm underline underline-offset-4">
            {t("Read the guide")}
          </Link>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
            {t("I agree to the")}{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              {t("Terms of Service & Privacy Policy")}
            </button>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={!agreed}>
          {t("Continue →")}
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
      className="relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 transition-colors has-[:checked]:border-foreground has-[:checked]:bg-muted/30"
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
