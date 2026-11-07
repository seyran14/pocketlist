"use client"

import { useT } from "@/components/I18nProvider"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ParsedUnitCard, type UnitFormValues } from "@/components/listings/ParsedUnitCard"
import { IdentityCard, type IdentityDocuments } from "@/components/listings/IdentityCard"
import { OwnerContactCard, hasRequiredContact, type OwnerContact } from "@/components/listings/OwnerContactCard"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { missingFields } from "@/lib/listing-rules"
import { MAX_LISTINGS_PER_USER } from "@/lib/utils"
import type { ParsedListing } from "@/lib/ai"

type Step = "paste" | "review"
type Unit = ParsedListing & { uid: string }

const CONTACT_PREFS = { phone: "PHONE", whatsapp: "WHATSAPP", telegram: "TELEGRAM" } as const

// Filled channels become visible to buyers and cleared ones stop being shown;
// any other choice the owner made in their profile (e.g. Email) is left alone.
function mergeContactPref(existing: string | null, contact: OwnerContact) {
  const prefs = new Set(existing ? existing.split(",").map((s) => s.trim()).filter(Boolean) : [])
  for (const [field, pref] of Object.entries(CONTACT_PREFS)) {
    if (contact[field as keyof typeof CONTACT_PREFS].trim()) prefs.add(pref)
    else prefs.delete(pref)
  }
  return [...prefs].join(",")
}

export function NewListingClient() {
  const t = useT()
  const router = useRouter()
  const [step, setStep] = useState<Step>("paste")
  const [rawText, setRawText] = useState("")
  const [units, setUnits] = useState<Unit[]>([])
  const [formValues, setFormValues] = useState<UnitFormValues[]>([])
  const [parsing, setParsing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [contact, setContact] = useState<OwnerContact | null>(null)
  const [savedContact, setSavedContact] = useState<OwnerContact | null>(null)
  const [contactPref, setContactPref] = useState<string | null>(null)
  const [contactError, setContactError] = useState(false)
  const [email, setEmail] = useState("")
  const [identity, setIdentity] = useState<IdentityDocuments>({ passport: null, emiratesId: null })
  const [identityError, setIdentityError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p) return
        const loaded = {
          name: p.name ?? "",
          phone: p.phone ?? "",
          whatsapp: p.whatsapp ?? "",
          telegram: p.telegram ?? "",
        }
        setContact(loaded)
        setSavedContact(loaded)
        setContactPref(p.contactPref)
        setEmail(p.email ?? "")
      })
      .catch(() => {})
    fetch("/api/documents")
      .then((r) => (r.ok ? r.json() : null))
      .then((documents) => documents && setIdentity(documents))
      .catch(() => {})
  }, [])

  async function saveContact() {
    if (!contact) return true
    if (JSON.stringify(contact) === JSON.stringify(savedContact)) return true
    const nextPref = mergeContactPref(contactPref, contact)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contact, contactPref: nextPref }),
    })
    if (res.ok) {
      setSavedContact(contact)
      setContactPref(nextPref)
    }
    return res.ok
  }

  async function handleParse() {
    if (!rawText.trim()) return
    setParsing(true)
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          toast.error(t("Daily parse limit reached (5/day). Use 'Fill manually' or try again tomorrow."))
        } else if (res.status === 422) {
          toast.error(t("No listings detected. Try pasting a single unit first."))
        } else {
          toast.error(t("AI parsing unavailable. Fill in the form manually below."))
          setUnits([withUid(blankUnit())])
          setFormValues([blankFormValues()])
          setStep("review")
        }
        return
      }
      setUnits(data.units.map(withUid))
      setFormValues(data.units.map(() => ({} as UnitFormValues)))
      setStep("review")
    } catch {
      toast.error(t("Network error. Please try again."))
    } finally {
      setParsing(false)
    }
  }

  function handleUnitChange(index: number, values: UnitFormValues) {
    setFormValues((prev) => {
      const next = [...prev]
      next[index] = values
      return next
    })
  }

  function handleRemove(index: number) {
    setUnits((prev) => prev.filter((_, i) => i !== index))
    setFormValues((prev) => prev.filter((_, i) => i !== index))
  }

  async function handlePublish(force = false) {
    const valid = formValues
    const incomplete = valid.findIndex((v) => missingFields(v).length > 0)
    if (incomplete >= 0) {
      toast.error(t("Unit {n}: add {fields}.", { n: incomplete + 1, fields: missingFields(valid[incomplete]).map((field) => t(field)).join(", ") }))
      return
    }
    if (!contact || !hasRequiredContact(contact)) {
      setContactError(true)
      toast.error(t("Add your name and phone number."))
      return
    }
    if (!identity.passport) {
      setIdentityError(true)
      toast.error(t("Upload your passport to publish."))
      return
    }
    setContactError(false)
    setIdentityError(false)
    setPublishing(true)
    try {
      if (!(await saveContact())) {
        toast.error(t("Couldn't save your contact details. Please try again."))
        return
      }
      // In order, so that near the limit the first units are the ones that get published.
      const duplicates: string[] = []
      let succeeded = 0
      let limitReached = false
      for (const unit of valid) {
        const res = await fetch(`/api/listings${force ? "?force=1" : ""}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unit),
        }).catch(() => null)
        if (res?.status === 403) {
          limitReached = true
          break
        }
        if (res?.status === 409) duplicates.push(unit.projectName)
        else if (res?.ok) succeeded++
      }

      if (limitReached) {
        toast.error(t("You've reached the limit of {n} listings. Delete one to add another.", { n: MAX_LISTINGS_PER_USER }))
      }
      if (duplicates.length > 0 && !force) {
        toast.warning(
          t("Possible duplicate: {names} already active. Publish anyway?", { names: duplicates.join(", ") }),
          {
            action: { label: t("Publish anyway"), onClick: () => handlePublish(true) },
            duration: 8000,
          }
        )
      }
      if (succeeded > 0) {
        toast.success(t("Sent for review: {n}. We'll email you when it's live.", { n: succeeded }))
        router.push("/dashboard")
      } else if (duplicates.length === 0 && !limitReached) {
        toast.error(t("Failed to publish listings. Please try again."))
      }
    } finally {
      setPublishing(false)
    }
  }

  return (
    <main className="card-animate mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("Back")}
        </button>
        <h1 className="text-2xl font-bold">{t("Add New Listing")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("Describe your property or paste an existing ad, and AI fills in the details. You'll add photos, your title deed and your passport on the next step.")}
        </p>
      </div>

      <Separator className="mb-6" />

      {step === "paste" && (
        <div className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Describe your property in your own words, or paste an existing ad. If you have several units, AI will extract each one separately.\n\nExample:\nPeninsula 2 | Business Bay\nStudio | 388 sqft | AED 1,380,000\nHandover Q1 2026 | Canal view`}
            className="min-h-56 text-sm resize-none"
            autoFocus
          />

          <div className="flex gap-3">
            <Button
              onClick={handleParse}
              disabled={!rawText.trim() || parsing}
              className="flex-1 sm:flex-none"
            >
              {parsing ? t("Parsing…") : t("Parse with AI")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUnits([withUid(blankUnit())])
                setFormValues([blankFormValues()])
                setStep("review")
              }}
            >
              {t("Fill manually")}
            </Button>
          </div>

          {parsing && (
            <div className="space-y-3 mt-2">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          )}
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("Units detected: {n}. Review and edit before publishing.", { n: units.length })}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setStep("paste")
                setUnits([])
                setFormValues([])
              }}
            >
              {t("Start over")}
            </Button>
          </div>

          {units.map((unit, i) => (
            <ParsedUnitCard
              key={unit.uid}
              index={i}
              total={units.length}
              data={unit}
              onChange={handleUnitChange}
              onRemove={handleRemove}
              onUploadingChange={(uploading) => setUploadingCount((n) => n + (uploading ? 1 : -1))}
            />
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setUnits((prev) => [...prev, withUid(blankUnit())])
              setFormValues((prev) => [...prev, blankFormValues()])
            }}
          >
            {t("+ Add another unit")}
          </Button>

          {contact && (
            <OwnerContactCard
              value={contact}
              onChange={(next) => {
                setContact(next)
                if (hasRequiredContact(next)) setContactError(false)
              }}
              email={email}
              showError={contactError}
            />
          )}

          <IdentityCard
            value={identity}
            onChange={setIdentity}
            showError={identityError}
            onUploadingChange={(uploading) => setUploadingCount((n) => n + (uploading ? 1 : -1))}
          />

          <Separator />

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStep("paste")
                setUnits([])
                setFormValues([])
              }}
              disabled={publishing}
            >
              {t("Start over")}
            </Button>
            <Button
              onClick={() => handlePublish()}
              disabled={publishing || uploadingCount > 0 || units.length === 0}
              className="min-w-36"
            >
              {uploadingCount > 0
                ? t("Uploading…")
                : publishing
                ? t("Submitting…")
                : t("Submit for review ({n})", { n: units.length })}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

// Rentals only for now, whatever the pasted ad says.
function withUid(unit: ParsedListing): Unit {
  return { ...unit, listingType: "RENT", uid: crypto.randomUUID() }
}

function blankUnit(): ParsedListing {
  return {
    listingType: "RENT",
    projectName: "",
    location: "",
    propertyType: "APARTMENT",
    bedrooms: null,
    bathrooms: null,
    areaSqft: null,
    areaSqm: null,
    plotSqft: null,
    plotSqm: null,
    price: null,
    floor: null,
    view: null,
    furnished: null,
    handover: null,
    isDistress: false,
    originalPrice: null,
    isRented: false,
    rentAmount: null,
    notes: null,
  }
}

function blankFormValues(): UnitFormValues {
  return blankUnit() as unknown as UnitFormValues
}
