"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ParsedUnitCard, type UnitFormValues } from "@/components/listings/ParsedUnitCard"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { ParsedListing } from "@/lib/ai"

type Step = "paste" | "review"

export function NewListingClient() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("paste")
  const [rawText, setRawText] = useState("")
  const [units, setUnits] = useState<ParsedListing[]>([])
  const [formValues, setFormValues] = useState<UnitFormValues[]>([])
  const [parsing, setParsing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
          toast.error("Daily parse limit reached (5/day). Use 'Fill manually' or try again tomorrow.")
        } else if (res.status === 422) {
          toast.error("No listings detected. Try pasting a single unit first.")
        } else {
          toast.error("AI parsing unavailable. Fill in the form manually below.")
          setUnits([blankUnit()])
          setFormValues([blankFormValues()])
          setStep("review")
        }
        return
      }
      setUnits(data.units)
      setFormValues(data.units.map(() => ({} as UnitFormValues)))
      setStep("review")
    } catch {
      toast.error("Network error. Please try again.")
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
    const valid = formValues.filter((v) => v?.projectName && v?.location)
    if (valid.length === 0) {
      toast.error("At least one listing needs a project name and location.")
      return
    }
    setPublishing(true)
    try {
      const results = await Promise.allSettled(
        valid.map((unit) =>
          fetch(`/api/listings${force ? "?force=1" : ""}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(unit),
          }).then(async (res) => {
            if (res.status === 409) {
              const data = await res.json()
              throw { duplicate: true, name: unit.projectName, id: data.listingId }
            }
            return res
          })
        )
      )
      const duplicates = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected" && r.reason?.duplicate)
        .map((r) => r.reason.name as string)
      const succeeded = results.filter((r) => r.status === "fulfilled").length

      if (duplicates.length > 0 && !force) {
        toast.warning(
          `Possible duplicate: "${duplicates.join(", ")}" already active. Publish anyway?`,
          {
            action: { label: "Publish anyway", onClick: () => handlePublish(true) },
            duration: 8000,
          }
        )
      }
      if (succeeded > 0) {
        toast.success(`${succeeded} listing${succeeded !== 1 ? "s" : ""} published`)
        router.push("/dashboard")
      } else if (duplicates.length === 0) {
        toast.error("Failed to publish listings. Please try again.")
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
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Add New Listing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste a WhatsApp or Telegram message — AI will extract each unit automatically.
        </p>
      </div>

      <Separator className="mb-6" />

      {step === "paste" && (
        <div className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste your listing message here — you can include multiple units from one WhatsApp/Telegram message. AI will extract each unit separately.\n\nExample:\nPeninsula 2 | Business Bay\nStudio | 388 sqft | AED 1,380,000\nHandover Q1 2026 | Canal view`}
            className="min-h-56 text-sm resize-none"
            autoFocus
          />

          <div className="flex gap-3">
            <Button
              onClick={handleParse}
              disabled={!rawText.trim() || parsing}
              className="flex-1 sm:flex-none"
            >
              {parsing ? "Parsing…" : "Parse with AI →"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUnits([blankUnit()])
                setFormValues([blankFormValues()])
                setStep("review")
              }}
            >
              Fill manually
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
              {units.length} unit{units.length !== 1 ? "s" : ""} detected — review and edit before
              publishing
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
              ← Start over
            </Button>
          </div>

          {units.map((unit, i) => (
            <ParsedUnitCard
              key={i}
              index={i}
              total={units.length}
              data={unit}
              onChange={handleUnitChange}
              onRemove={handleRemove}
            />
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setUnits((prev) => [...prev, blankUnit()])
              setFormValues((prev) => [...prev, blankFormValues()])
            }}
          >
            + Add another unit
          </Button>

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
              Start over
            </Button>
            <Button
              onClick={() => handlePublish()}
              disabled={publishing || units.length === 0}
              className="min-w-36"
            >
              {publishing
                ? "Publishing…"
                : `Publish ${units.length} Listing${units.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

function blankUnit(): ParsedListing {
  return {
    listingType: "SALE",
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
