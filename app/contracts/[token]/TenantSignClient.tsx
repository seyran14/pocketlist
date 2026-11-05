"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SignaturePad } from "@/components/contracts/SignaturePad"
import { useT } from "@/components/I18nProvider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LATIN_TEXT } from "@/lib/tenancy-shared"

type Props = { token: string; email: string; initialName: string; status: string }

export function TenantSignClient({ token, email, initialName, status }: Props) {
  const t = useT()
  const [current, setCurrent] = useState(status)
  const [name, setName] = useState(initialName)
  const [emiratesId, setEmiratesId] = useState("")
  const [passport, setPassport] = useState("")
  const [phone, setPhone] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const pdfUrl = `/contracts/${token}/document`

  async function submit() {
    setSending(true)
    const res = await fetch(`/api/contracts/sign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantName: name, tenantEmiratesId: emiratesId, tenantPassport: passport, tenantPhone: phone, signature }),
    })
    setSending(false)
    if (res.ok) {
      setCurrent("AWAITING_OWNER")
      return
    }
    const data = await res.json().catch(() => ({}))
    toast.error(data.error ?? t("Failed to sign. Please try again."))
  }

  if (current !== "AWAITING_TENANT") {
    const completed = current === "COMPLETED"
    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <p className="font-medium">{completed ? t("Both parties have signed") : t("You've signed. The owner signs next")}</p>
        <p className="text-sm text-muted-foreground">
          {completed
            ? t("You can register the contract on Ejari yourself. It takes effect once it's registered.")
            : t("We'll email you the finished contract as soon as the owner signs.")}
        </p>
        <a href={pdfUrl} target="_blank" rel="noreferrer">
          <Button variant={completed ? "default" : "outline"}>{completed ? t("Download the contract") : t("Open contract")}</Button>
        </a>
      </div>
    )
  }

  const nameIsLatin = LATIN_TEXT.test(name)
  const ready = name.trim() && nameIsLatin && phone.trim() && (emiratesId.trim() || passport.trim()) && signature && agreed

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("The owner filled in the contract. Read it before you sign. The owner signs after you.")}</p>
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="shrink-0"><Button variant="outline" size="sm">{t("Open contract")}</Button></a>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">{t("Your details")}</h2>
        <p className="text-xs text-muted-foreground">{t("These are printed on the contract, in English, as in your passport.")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="tenant-name" className="text-xs text-muted-foreground">{t("Full name")}</Label>
            <Input id="tenant-name" value={name} aria-invalid={!nameIsLatin} placeholder={t("Name and surname as in your passport")} onChange={(e) => setName(e.target.value)} className="mt-1" />
            {!nameIsLatin && <p role="alert" className="mt-1 text-xs text-destructive">{t("Use English letters and numbers only.")}</p>}
          </div>
          <div>
            <Label htmlFor="tenant-eid" className="text-xs text-muted-foreground">{t("Emirates ID")}</Label>
            <Input id="tenant-eid" value={emiratesId} onChange={(e) => setEmiratesId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-passport" className="text-xs text-muted-foreground">{t("Passport number, if no Emirates ID")}</Label>
            <Input id="tenant-passport" value={passport} onChange={(e) => setPassport(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-email" className="text-xs text-muted-foreground">{t("Email")}</Label>
            <Input id="tenant-email" value={email} readOnly disabled className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-phone" className="text-xs text-muted-foreground">{t("Phone")}</Label>
            <Input id="tenant-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">{t("Your signature")}</h2>
        <SignaturePad onChange={setSignature} />
        <div className="flex items-start gap-2">
          <Checkbox id="tenant-agree" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
          <Label htmlFor="tenant-agree" className="cursor-pointer text-sm font-normal">
            {t("I've read the contract and agree to sign it electronically.")}
          </Label>
        </div>
        <Button className="w-full" disabled={!ready || sending} onClick={submit}>
          {sending ? t("Signing…") : t("Sign the contract")}
        </Button>
      </div>
    </div>
  )
}
