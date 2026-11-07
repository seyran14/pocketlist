"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Listing = {
  id: string
  projectName: string
  location: string
  status: string
  priceLabel: string | null
  agent: { name: string | null; email: string }
}

export function AdminListingRow({ listing }: { listing: Listing }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    setDeleting(true)
    const res = await fetch(`/admin/api/listings/${listing.id}`, { method: "DELETE" })
    setDeleting(false)
    setConfirming(false)
    if (res.ok) {
      toast.success(`${listing.projectName} deleted`)
      router.refresh()
    } else {
      toast.error("Failed to delete the listing")
    }
  }

  return (
    <li className="space-y-2 p-4">
      <div className="min-w-0">
        <Link href={`/listings/${listing.id}`} className="font-medium [overflow-wrap:anywhere] hover:underline">
          {listing.projectName}
        </Link>
        <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {listing.location} · {listing.priceLabel ?? "–"} · {listing.status}
        </p>
        <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {listing.agent.name ?? "No name"} · {listing.agent.email}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {confirming ? (
          <>
            <Button variant="destructive" size="sm" disabled={deleting} onClick={remove}>
              {deleting ? "Deleting…" : "Delete for good"}
            </Button>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setConfirming(false)}>Cancel</Button>
          </>
        ) : (
          <>
            <Link href={`/admin/listings/${listing.id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>Delete</Button>
          </>
        )}
      </div>
    </li>
  )
}
