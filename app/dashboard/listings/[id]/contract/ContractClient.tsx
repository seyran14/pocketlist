"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SignaturePad } from "@/components/contracts/SignaturePad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Contract = { id: string; status: string; tenantEmail: string; tenantName: string | null; createdAt: string }

type Defaults = {
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  plotNumber: string
  buildingName: string
  propertyNumber: string
  propertyType: string
  areaSqm: string
  location: string
  annualRent: number
  cheques: number
}

type Props = { listingId: string; eligible: boolean; contracts: Contract[]; defaults: Defaults }

const TEXT_FIELDS = [
  ["tenantEmail", "Tenant's email", "email"],
  ["tenantName", "Tenant's name (optional)", "text"],
  ["ownerName", "Your name, as on the title deed", "text"],
  ["ownerEmiratesId", "Your Emirates ID", "text"],
  ["ownerPassport", "Your passport number, if no Emirates ID", "text"],
  ["ownerPhone", "Your phone", "tel"],
  ["buildingName", "Building name", "text"],
  ["propertyNumber", "Property number", "text"],
  ["propertyType", "Property type", "text"],
  ["areaSqm", "Area (sqm)", "text"],
  ["location", "Location", "text"],
  ["plotNumber", "Plot number", "text"],
  ["makaniNumber", "Makani number", "text"],
  ["dewaNumber", "DEWA premises number", "text"],
  ["startDate", "Start date", "date"],
  ["endDate", "End date", "date"],
  ["annualRent", "Annual rent (AED)", "number"],
  ["contractValue", "Contract value (AED)", "number"],
  ["deposit", "Security deposit (AED)", "number"],
  ["cheques", "Number of cheques", "number"],
] as const

const NUMBER_FIELDS = ["annualRent", "contractValue", "deposit", "cheques"]

export function ContractClient({ listingId, eligible, contracts, defaults }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>({
    ...Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, String(v)])),
    contractValue: String(defaults.annualRent),
  })
  const [additionalTerms, setAdditionalTerms] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ url: string; emailed: boolean } | null>(null)

  async function submit() {
    setSending(true)
    const numbers = Object.fromEntries(NUMBER_FIELDS.map((f) => [f, Number(values[f])]))
    const texts = Object.fromEntries(
      TEXT_FIELDS.filter(([k]) => !NUMBER_FIELDS.includes(k)).map(([k]) => [k, values[k] ?? ""])
    )
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...texts,
        ...numbers,
        listingId,
        ownerEmail: defaults.ownerEmail,
        additionalTerms,
        signature,
      }),
    })
    setSending(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setSent({ url: data.url, emailed: data.emailed })
      router.refresh()
    } else {
      toast.error(data.error ?? "Failed to create the contract")
    }
  }

  async function withdraw(id: string) {
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" })
    if (res.ok) router.refresh()
    else toast.error("Failed to withdraw the contract")
  }

  return (
    <main className="ph-no-capture mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="mt-2 text-2xl font-bold">Tenancy contract</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We fill in the standard Dubai contract. You sign first, then the tenant signs from a link. As the landlord you
          then register it on Ejari.
        </p>
      </div>

      {contracts.map((contract) => (
        <div key={contract.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{contract.tenantName ?? contract.tenantEmail}</p>
            <p className="text-xs text-muted-foreground">
              {contract.status === "COMPLETED" ? "Signed by both. Register it on Ejari." : "Waiting for the tenant to sign"}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/contracts/${contract.id}/document`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">Open PDF</Button>
            </a>
            {contract.status !== "COMPLETED" && (
              <Button variant="ghost" size="sm" onClick={() => withdraw(contract.id)}>Withdraw</Button>
            )}
          </div>
        </div>
      ))}

      {sent && (
        <div role="status" className="space-y-2 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">
            {sent.emailed ? "We emailed the tenant a link to sign." : "We couldn't email the tenant. Send them this link."}
          </p>
          <Input readOnly value={sent.url} onFocus={(e) => e.target.select()} aria-label="Link for the tenant" />
          <p className="text-xs text-muted-foreground">This link is shown only once. Anyone who has it can sign as the tenant.</p>
        </div>
      )}

      {!eligible ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Contracts are available for approved rental listings.
        </p>
      ) : !sent && (
        <>
          <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
            {TEXT_FIELDS.map(([key, label, type]) => (
              <div key={key}>
                <Label htmlFor={`contract-${key}`} className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  id={`contract-${key}`}
                  type={type}
                  value={values[key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="contract-terms" className="text-xs text-muted-foreground">Additional term (optional)</Label>
              <Input id="contract-terms" value={additionalTerms} onChange={(e) => setAdditionalTerms(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Your signature</h2>
            <SignaturePad onChange={setSignature} />
            <Button className="w-full" disabled={!signature || sending} onClick={submit}>
              {sending ? "Signing…" : "Sign and send to the tenant"}
            </Button>
          </div>
        </>
      )}
    </main>
  )
}
