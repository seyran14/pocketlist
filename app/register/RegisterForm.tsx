"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TermsModal } from "@/components/TermsModal"
import { registerAction } from "@/lib/actions/auth"

export function RegisterForm() {
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <form action={registerAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
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
          <Label>I am…</Label>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              id="role-buyer"
              value="BUYER"
              title="Looking to buy"
              description="Browse listings and contact agents"
              defaultChecked
            />
            <RoleCard
              id="role-agent"
              value="AGENT"
              title="Agent / Seller"
              description="Post listings and get contacted by buyers"
            />
          </div>
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
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Terms of Service & Privacy Policy
            </button>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={!agreed}>
          Continue →
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  )
}

function RoleCard({
  id, value, title, description, defaultChecked,
}: {
  id: string; value: "BUYER" | "AGENT"
  title: string; description: string; defaultChecked?: boolean
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
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span className="font-semibold text-sm mb-1">{title}</span>
      <span className="text-xs text-muted-foreground leading-snug">{description}</span>
    </label>
  )
}
