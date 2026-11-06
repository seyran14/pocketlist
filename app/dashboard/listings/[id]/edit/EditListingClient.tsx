"use client"

import { useT } from "@/components/I18nProvider"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ParsedUnitCard, type UnitData, type UnitFormValues } from "@/components/listings/ParsedUnitCard"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function EditListingClient({ admin = false }: { admin?: boolean }) {
  const t = useT()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const apiPath = `${admin ? "/admin/api" : "/api"}/listings/${params.id}`
  const homePath = admin ? "/admin/listings" : "/dashboard"
  const STATUS_DISPLAY: Record<string, string> = {
    ACTIVE: t("Active"), RESERVED: t("Under Offer"), SOLD: t("Sold"),
  }

  const [listing, setListing] = useState<(UnitData & { status: string; reviewNote: string | null }) | null>(null)
  const [formValues, setFormValues] = useState<UnitFormValues | null>(null)
  const [status, setStatus] = useState("ACTIVE")
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((data) => {
        const normalized = { ...data, notes: data.description ?? null }
        setListing(normalized)
        setStatus(data.status)
        setListingType(data.listingType ?? "SALE")
        setFormValues(normalized)
      })
  }, [apiPath])

  const inReview = listing?.status === "PENDING_REVIEW" || listing?.status === "REJECTED"

  async function handleSave() {
    if (!formValues) return
    setSaving(true)
    const res = await fetch(apiPath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formValues, status, listingType }),
    })
    setSaving(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(data.status === "PENDING_REVIEW" ? t("Sent for review. We'll email you when it's live.") : t("Listing updated"))
      router.push(homePath)
      if (admin) router.refresh()
    } else if (data.error === "missing_fields") {
      toast.error(t("Add {fields}.", { fields: data.fields.map((field: string) => t(field)).join(", ") }))
    } else {
      toast.error(t("Failed to save changes"))
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(apiPath, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success(t("Listing deleted"))
      router.push(homePath)
      if (admin) router.refresh()
    } else {
      toast.error(t("Failed to delete listing"))
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <main className="card-animate mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => router.push(homePath)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("Back")}
        </button>
        <h1 className="text-2xl font-bold">{t("Edit Listing")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Update details or change status.")}</p>
      </div>

      <Separator className="mb-6" />

      {!listing ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {inReview && (
            <div role="status" className="rounded-xl border bg-card p-4 text-sm">
              <p className="font-medium">
                {listing.status === "REJECTED" ? t("This listing needs changes") : t("This listing is waiting for review")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {listing.reviewNote ?? t("It isn't visible to buyers yet.")}
                {listing.status === "REJECTED" && t(" Save your changes to send it back for review.")}
              </p>
            </div>
          )}

          {!inReview && !admin && (
            <p className="text-xs text-muted-foreground">
              {t("Changing the building, location, type, area, parking, property number or title deed sends this listing back for review, and it's hidden until approved.")}
            </p>
          )}

          <ParsedUnitCard
            index={0}
            total={1}
            data={listing}
            onChange={(_, values) => setFormValues(values)}
            onRemove={() => {}}
            onUploadingChange={setUploading}
            ownerTools={!admin}
          />

          {!inReview && <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{t("Status")}</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="h-8 w-48 text-sm">
                  <span>{STATUS_DISPLAY[status] ?? status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("Active")}</SelectItem>
                  <SelectItem value="RESERVED">{t("Under Offer")}</SelectItem>
                  <SelectItem value="SOLD">{t("Sold")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>}

          <Separator />

          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? t("Deleting…") : t("Confirm delete")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    {t("Cancel")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                >
                  {t("Delete listing")}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(homePath)}
                disabled={saving || deleting}
              >
                {t("Cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting || uploading || !listing}>
                {uploading ? t("Uploading…") : saving ? t("Saving…") : t("Save changes")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
