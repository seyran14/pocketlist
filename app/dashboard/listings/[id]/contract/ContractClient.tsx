"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { SignaturePad } from "@/components/contracts/SignaturePad"
import { useT } from "@/components/I18nProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LATIN_TEXT, MAX_ADDITIONAL_TERMS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/tenancy-shared"
import { cn } from "@/lib/utils"

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

type Field = { key: string; label: string; type?: string; required?: boolean; hint?: string; wide?: boolean }

const STEPS: { title: string; lead: string; fields: Field[] }[] = [
  {
    title: "Owner",
    lead: "Your details, as they appear on the title deed.",
    fields: [
      { key: "ownerName", label: "Owner's name", required: true, wide: true, hint: "Name and surname as in your passport, in English letters." },
      { key: "ownerEmiratesId", label: "Emirates ID" },
      { key: "ownerPassport", label: "Passport number", hint: "Needed if you have no Emirates ID." },
      { key: "ownerPhone", label: "Phone", type: "tel", required: true },
    ],
  },
  {
    title: "Tenant",
    lead: "We'll email the tenant a link. They add their own details and sign first.",
    fields: [
      { key: "tenantEmail", label: "Tenant's email", type: "email", required: true },
      { key: "tenantName", label: "Tenant's name", hint: "Optional. The tenant can fill this in." },
    ],
  },
  {
    title: "Property",
    lead: "Taken from your listing and title deed. Check that it's right.",
    fields: [
      { key: "buildingName", label: "Building name", required: true },
      { key: "propertyNumber", label: "Property No.", required: true },
      { key: "propertyType", label: "Property type", required: true },
      { key: "areaSqm", label: "Property area (sqm)" },
      { key: "location", label: "Location", required: true },
      { key: "plotNumber", label: "Plot No." },
      { key: "makaniNumber", label: "Makani No." },
      { key: "dewaNumber", label: "Premises No. (DEWA)" },
    ],
  },
  {
    title: "Contract",
    lead: "The period, the rent and how it's paid.",
    fields: [
      { key: "startDate", label: "Start date", type: "date", required: true },
      { key: "endDate", label: "End date", type: "date", required: true },
      { key: "annualRent", label: "Annual rent (AED)", type: "number", required: true },
      { key: "contractValue", label: "Contract value (AED)", type: "number", required: true },
      { key: "deposit", label: "Security deposit (AED)", type: "number", required: true },
    ],
  },
  { title: "Additional terms", lead: "Optional. Up to five, in English. They're printed on the contract.", fields: [] },
  { title: "Review", lead: "Check everything, then send it to the tenant.", fields: [] },
]

const TERMS_STEP = 4
const REVIEW_STEP = 5
const CONTRACT_STEP = 3

function StatusRow({ contract, onChanged }: { contract: Contract; onChanged: () => void }) {
  const t = useT()
  const [signature, setSignature] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const awaitingOwner = contract.status === "AWAITING_OWNER"

  const STATUS: Record<string, string> = {
    AWAITING_TENANT: t("Waiting for the tenant to sign"),
    AWAITING_OWNER: t("The tenant signed. Check the contract, then add your signature."),
    COMPLETED: t("Signed by both. The contract was emailed to you and the tenant."),
  }

  async function withdraw() {
    const res = await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" })
    if (res.ok) onChanged()
    else toast.error(t("Failed to withdraw the contract"))
  }

  async function sign() {
    setSigning(true)
    const res = await fetch(`/api/contracts/${contract.id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature }),
    })
    setSigning(false)
    if (res.ok) {
      toast.success(t("Signed. We emailed the contract to you and the tenant."))
      onChanged()
    } else {
      toast.error(t("Failed to sign. Please try again."))
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{contract.tenantName ?? contract.tenantEmail}</p>
          <p className="text-xs text-muted-foreground">{STATUS[contract.status]}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/contracts/${contract.id}/document`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">{t("Open PDF")}</Button>
          </a>
          {contract.status !== "COMPLETED" && (
            <Button variant="ghost" size="sm" onClick={withdraw}>{t("Withdraw")}</Button>
          )}
        </div>
      </div>

      {awaitingOwner && (
        <div className="space-y-3 border-t pt-3">
          <h2 className="text-sm font-semibold">{t("Your signature")}</h2>
          <SignaturePad onChange={setSignature} />
          <Button className="w-full" disabled={!signature || signing} onClick={sign}>
            {signing ? t("Signing…") : t("Sign and finish")}
          </Button>
        </div>
      )}
    </div>
  )
}

export function ContractClient({ listingId, eligible, contracts, defaults }: Props) {
  const router = useRouter()
  const t = useT()
  const [values, setValues] = useState<Record<string, string>>({
    ...Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, String(v)])),
    contractValue: String(defaults.annualRent),
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CHEQUES")
  const [terms, setTerms] = useState([""])
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ url: string; emailed: boolean } | null>(null)

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }))
  const openContract = contracts.some((c) => c.status !== "COMPLETED")
  const current = STEPS[step]

  function validate(index: number) {
    const found: Record<string, string> = {}
    for (const { key, required } of STEPS[index].fields) {
      const value = values[key]?.trim() ?? ""
      if (required && !value) found[key] = t("Required.")
      else if (!LATIN_TEXT.test(value)) found[key] = t("Use English letters and numbers only.")
    }
    if (index === 0 && !values.ownerEmiratesId?.trim() && !values.ownerPassport?.trim()) {
      found.ownerPassport = t("Add your passport or Emirates ID number.")
    }
    if (index === CONTRACT_STEP) {
      if (values.startDate && values.endDate && values.endDate <= values.startDate) {
        found.endDate = t("Must be after the start date.")
      }
      if (paymentMethod === "CHEQUES" && !(Number(values.cheques) >= 1 && Number(values.cheques) <= 12)) {
        found.cheques = t("Add the number of cheques, from 1 to 12.")
      }
    }
    if (index === TERMS_STEP && terms.some((term) => !LATIN_TEXT.test(term))) {
      found.terms = t("Use English letters and numbers only.")
    }
    setErrors(found)
    return Object.keys(found).length === 0
  }

  function next() {
    if (!validate(step)) return
    setStep(step + 1)
    setReached(Math.max(reached, step + 1))
    window.scrollTo({ top: 0 })
  }

  function goTo(index: number) {
    if (index > reached) return
    setErrors({})
    setStep(index)
  }

  async function submit() {
    setSending(true)
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...Object.fromEntries(
          ["ownerName", "ownerEmiratesId", "ownerPassport", "ownerPhone", "tenantEmail", "tenantName", "buildingName",
            "propertyNumber", "propertyType", "areaSqm", "location", "plotNumber", "makaniNumber", "dewaNumber",
            "startDate", "endDate"].map((k) => [k, values[k] ?? ""])
        ),
        listingId,
        ownerEmail: defaults.ownerEmail,
        annualRent: Number(values.annualRent),
        contractValue: Number(values.contractValue),
        deposit: Number(values.deposit),
        paymentMethod,
        cheques: paymentMethod === "CHEQUES" ? Number(values.cheques) : null,
        additionalTerms: terms.filter((term) => term.trim()),
      }),
    })
    setSending(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setSent({ url: data.url, emailed: data.emailed })
      router.refresh()
    } else {
      toast.error(data.error ?? t("Failed to create the contract"))
    }
  }

  const renderField = ({ key, label, type, required, hint, wide }: Field) => (
    <div key={key} className={cn(wide && "sm:col-span-2")}>
      <Label htmlFor={`contract-${key}`} className="text-xs text-muted-foreground">
        {t(label)}{required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={`contract-${key}`}
        type={type}
        dir={type === "date" || type === "number" || type === "tel" ? "ltr" : undefined}
        value={values[key] ?? ""}
        aria-invalid={!!errors[key]}
        onChange={(e) => set(key, e.target.value)}
        className="mt-1"
      />
      {errors[key] ? (
        <p role="alert" className="mt-1 text-xs text-destructive">{errors[key]}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{t(hint)}</p>
      ) : null}
    </div>
  )

  const paymentSummary = paymentMethod === "CHEQUES"
    ? `${t(PAYMENT_METHODS.CHEQUES)}: ${values.cheques}`
    : t(PAYMENT_METHODS[paymentMethod])

  return (
    <main className="ph-no-capture mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← {t("Back")}</Link>
        <h1 className="mt-2 text-2xl font-bold">{t("Tenancy contract")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("You fill in the contract, the tenant adds their details and signs, then you check it and sign last. Both of you get the finished contract by email.")}
        </p>
      </div>

      {contracts.map((contract) => (
        <StatusRow key={contract.id} contract={contract} onChanged={() => router.refresh()} />
      ))}

      {sent && (
        <div role="status" className="space-y-2 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">
            {sent.emailed ? t("We emailed the tenant a link to sign.") : t("We couldn't email the tenant. Send them this link.")}
          </p>
          <Input readOnly dir="ltr" value={sent.url} onFocus={(e) => e.target.select()} aria-label={t("Link for the tenant")} />
          <p className="text-xs font-medium text-destructive">
            {t("This link is shown only once. Anyone who has it can sign as the tenant.")}
          </p>
        </div>
      )}

      {!eligible ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          {t("Contracts are available for approved rental listings.")}
        </p>
      ) : !sent && !openContract && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ol className="flex gap-1 overflow-x-auto border-b p-2 [scrollbar-width:none]">
            {STEPS.map((item, i) => {
              const done = i < reached && i !== step
              return (
                <li key={item.title} className="shrink-0">
                  <button
                    type="button"
                    disabled={i > reached}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => goTo(i)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      i === step ? "bg-muted font-medium" : "text-muted-foreground",
                      i <= reached && i !== step && "hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border text-[11px] tabular-nums",
                        i === step && "border-foreground bg-foreground text-background",
                        done && "border-transparent bg-emerald-600 text-white"
                      )}
                    >
                      {done ? <Check size={12} /> : i + 1}
                    </span>
                    {t(item.title)}
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">{t(current.title)}</h2>
              <p className="text-sm text-muted-foreground">{t(current.lead)}</p>
            </div>

            {current.fields.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">{current.fields.map(renderField)}</div>
            )}

            {step === CONTRACT_STEP && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("Mode of payment")}<span className="text-destructive"> *</span>
                  </Label>
                  <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger className="mt-1 w-full">
                      <span>{t(PAYMENT_METHODS[paymentMethod])}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{t(label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod === "CHEQUES" && renderField({
                  key: "cheques", label: "Number of cheques", type: "number", required: true,
                })}
              </div>
            )}

            {step === TERMS_STEP && (
              <div className="space-y-3">
                {terms.map((term, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`contract-term-${i}`} className="text-xs text-muted-foreground">
                        {t("Additional term {n}", { n: i + 1 })}
                      </Label>
                      {terms.length > 1 && (
                        <button
                          type="button"
                          aria-label={t("Remove")}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setTerms(terms.filter((_, index) => index !== i))}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <Textarea
                      id={`contract-term-${i}`}
                      dir="ltr"
                      value={term}
                      maxLength={120}
                      onChange={(e) => setTerms(terms.map((item, index) => (index === i ? e.target.value : item)))}
                      className="mt-1 min-h-16 resize-none text-sm"
                    />
                    <p className="mt-1 text-end text-xs text-muted-foreground tabular-nums">{term.length} / 120</p>
                  </div>
                ))}
                {errors.terms && <p role="alert" className="text-xs text-destructive">{errors.terms}</p>}
                {terms.length < MAX_ADDITIONAL_TERMS && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setTerms([...terms, ""])}>
                    <Plus size={14} className="me-1" />
                    {t("Add another term")}
                  </Button>
                )}
              </div>
            )}

            {step === REVIEW_STEP && (
              <div className="space-y-4">
                {STEPS.slice(0, TERMS_STEP).map((item, i) => (
                  <section key={item.title} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{t(item.title)}</h3>
                      <button type="button" className="text-xs underline underline-offset-4" onClick={() => goTo(i)}>
                        {t("Edit")}
                      </button>
                    </div>
                    <dl className="text-sm">
                      {item.fields.filter((f) => values[f.key]?.trim()).map((f) => (
                        <div key={f.key} className="flex justify-between gap-3 py-0.5">
                          <dt className="text-muted-foreground">{t(f.label)}</dt>
                          <dd dir="ltr" className="text-end font-medium">{values[f.key]}</dd>
                        </div>
                      ))}
                      {i === CONTRACT_STEP && (
                        <div className="flex justify-between gap-3 py-0.5">
                          <dt className="text-muted-foreground">{t("Mode of payment")}</dt>
                          <dd className="text-end font-medium">{paymentSummary}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                ))}
                {terms.some((term) => term.trim()) && (
                  <section className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{t("Additional terms")}</h3>
                      <button type="button" className="text-xs underline underline-offset-4" onClick={() => goTo(TERMS_STEP)}>
                        {t("Edit")}
                      </button>
                    </div>
                    <ol dir="ltr" className="list-decimal space-y-1 ps-4 text-sm">
                      {terms.filter((term) => term.trim()).map((term, i) => <li key={i}>{term}</li>)}
                    </ol>
                  </section>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 border-t p-4">
            <Button variant="outline" disabled={step === 0} onClick={() => goTo(step - 1)}>{t("Back")}</Button>
            {step === REVIEW_STEP ? (
              <Button disabled={sending} onClick={submit}>{sending ? t("Sending…") : t("Send to the tenant")}</Button>
            ) : (
              <Button onClick={next}>{t("Next")}</Button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
