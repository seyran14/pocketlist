"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ParsedUnitCard, type UnitFormValues } from "@/components/listings/ParsedUnitCard"
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
import type { ParsedListing } from "@/lib/ai"

export function EditListingClient() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const STATUS_DISPLAY: Record<string, string> = {
    ACTIVE: "Active", RESERVED: "Under Offer", SOLD: "Sold",
  }

  const [listing, setListing] = useState<(ParsedListing & { status: string }) | null>(null)
  const [formValues, setFormValues] = useState<UnitFormValues | null>(null)
  const [status, setStatus] = useState("ACTIVE")
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        const normalized = { ...data, notes: data.description ?? null }
        setListing(normalized)
        setStatus(data.status)
        setListingType(data.listingType ?? "SALE")
        setFormValues(normalized)
      })
  }, [params.id])

  async function handleSave() {
    if (!formValues) return
    setSaving(true)
    const res = await fetch(`/api/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formValues, status, listingType }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Listing updated")
      router.push("/dashboard")
    } else {
      toast.error("Failed to save changes")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/listings/${params.id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success("Listing deleted")
      router.push("/dashboard")
    } else {
      toast.error("Failed to delete listing")
      setDeleting(false)
      setConfirmDelete(false)
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
        <h1 className="text-2xl font-bold">Edit Listing</h1>
        <p className="text-muted-foreground text-sm mt-1">Update details or change status.</p>
      </div>

      <Separator className="mb-6" />

      {!listing ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          <ParsedUnitCard
            index={0}
            total={1}
            data={listing}
            onChange={(_, values) => setFormValues(values)}
            onRemove={() => {}}
          />

          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="h-8 w-48 text-sm">
                  <span>{STATUS_DISPLAY[status] ?? status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="RESERVED">Under Offer</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    {deleting ? "Deleting…" : "Confirm delete"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                >
                  Delete listing
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={saving || deleting}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting || !listing}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
