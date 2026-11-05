"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SignaturePad } from "@/components/contracts/SignaturePad"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { token: string; email: string; initialName: string; completed: boolean }

export function TenantSignClient({ token, email, initialName, completed }: Props) {
  const [done, setDone] = useState(completed)
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
      setDone(true)
      return
    }
    const data = await res.json().catch(() => ({}))
    toast.error(data.error ?? "Failed to sign. Please try again.")
  }

  if (done) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <p className="font-medium">Both parties have signed</p>
        <p className="text-sm text-muted-foreground">
          The contract takes effect once the landlord registers it on Ejari. Keep a copy for your records.
        </p>
        <a href={pdfUrl} target="_blank" rel="noreferrer"><Button>Download the contract</Button></a>
      </div>
    )
  }

  const ready = name.trim() && phone.trim() && (emiratesId.trim() || passport.trim()) && signature && agreed

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">The owner has signed. Read the contract before you sign.</p>
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="shrink-0"><Button variant="outline" size="sm">Open contract</Button></a>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Your details</h2>
        <p className="text-xs text-muted-foreground">In English, as on your passport. These are printed on the contract.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="tenant-name" className="text-xs text-muted-foreground">Full name</Label>
            <Input id="tenant-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-eid" className="text-xs text-muted-foreground">Emirates ID</Label>
            <Input id="tenant-eid" value={emiratesId} onChange={(e) => setEmiratesId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-passport" className="text-xs text-muted-foreground">Passport number, if no Emirates ID</Label>
            <Input id="tenant-passport" value={passport} onChange={(e) => setPassport(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-email" className="text-xs text-muted-foreground">Email</Label>
            <Input id="tenant-email" value={email} readOnly disabled className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tenant-phone" className="text-xs text-muted-foreground">Phone</Label>
            <Input id="tenant-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Your signature</h2>
        <SignaturePad onChange={setSignature} />
        <div className="flex items-start gap-2">
          <Checkbox id="tenant-agree" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
          <Label htmlFor="tenant-agree" className="cursor-pointer text-sm font-normal">
            I&apos;ve read the contract and agree to sign it electronically.
          </Label>
        </div>
        <Button className="w-full" disabled={!ready || sending} onClick={submit}>
          {sending ? "Signing…" : "Sign the contract"}
        </Button>
      </div>
    </div>
  )
}
