"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn, formatPrice, formatBeds, daysAgo } from "@/lib/utils"
import { toast } from "sonner"

type Listing = {
  id: string
  projectName: string
  location: string
  bedrooms: string
  price: number
  priceLabel: string | null
  status: string
  createdAt: string
  viewCount: number
}

type Props = {
  listings: Listing[]
}

type SortKey = "projectName" | "price" | "bedrooms" | "createdAt" | "viewCount"
type SortDir = "asc" | "desc"
type SortEntry = { key: SortKey; dir: SortDir }

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  RESERVED: { label: "Under Offer", variant: "secondary" },
  SOLD: { label: "Sold", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "destructive" },
}

function bedsValue(bedrooms: string | null): number {
  if (!bedrooms || bedrooms === "STUDIO") return 0
  return parseInt(bedrooms) || 0
}

function SortTh({
  col, label, className, sorts, onSort,
}: {
  col: SortKey; label: string; className?: string
  sorts: SortEntry[]; onSort: (col: SortKey) => void
}) {
  const entry = sorts.find((s) => s.key === col)
  const idx = sorts.findIndex((s) => s.key === col)
  const isMulti = sorts.length > 1
  return (
    <th className={cn("px-4 py-2.5 font-medium", className)}>
      <button
        className={cn("flex items-center gap-1 hover:text-foreground transition-colors", entry && "text-foreground")}
        onClick={() => onSort(col)}
      >
        {label}
        {entry ? (
          <span className="flex items-center gap-0.5">
            {entry.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {isMulti && <span className="text-[10px] leading-none opacity-50">{idx + 1}</span>}
          </span>
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </button>
    </th>
  )
}

export function AgentDashboard({ listings }: Props) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string[]>(["ACTIVE", "RESERVED"])
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [sorts, setSorts] = useState<SortEntry[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  function handleSort(key: SortKey) {
    setSorts((prev) => {
      const existing = prev.find((s) => s.key === key)
      if (!existing) return [...prev, { key, dir: "asc" }]
      if (existing.dir === "asc") return prev.map((s) => s.key === key ? { ...s, dir: "desc" } : s)
      return prev.filter((s) => s.key !== key)
    })
  }

  const filtered = listings.filter((l) => statusFilter.includes(l.status))

  const sorted = sorts.length
    ? [...filtered].sort((a, b) => {
        for (const { key, dir } of sorts) {
          let cmp = 0
          if (key === "projectName") cmp = a.projectName.localeCompare(b.projectName)
          else if (key === "price") cmp = a.price - b.price
          else if (key === "bedrooms") cmp = bedsValue(a.bedrooms) - bedsValue(b.bedrooms)
          else if (key === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          else if (key === "viewCount") cmp = a.viewCount - b.viewCount
          if (cmp !== 0) return dir === "asc" ? cmp : -cmp
        }
        return 0
      })
    : filtered

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
  }

  async function updateStatus(id: string, status: string, name: string) {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`${name} marked as ${STATUS_LABELS[status]?.label ?? status}`)
      startTransition(() => router.refresh())
    }
  }

  async function renewListing(id: string, name: string) {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh" }),
    })
    if (res.ok) {
      toast.success(`${name} renewed for 30 days`)
      startTransition(() => router.refresh())
    }
  }

  async function deleteListing(id: string, name: string) {
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success(`${name} deleted`)
      setConfirmDeleteId(null)
      startTransition(() => router.refresh())
    }
  }

  async function bulkUpdateStatus(status: string) {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    )
    toast.success(`${selectedIds.size} listing${selectedIds.size > 1 ? "s" : ""} marked as ${STATUS_LABELS[status]?.label ?? status}`)
    clearSelection()
    startTransition(() => router.refresh())
  }

  async function bulkDelete() {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/listings/${id}`, { method: "DELETE" })
      )
    )
    toast.success(`${selectedIds.size} listing${selectedIds.size > 1 ? "s" : ""} deleted`)
    clearSelection()
    startTransition(() => router.refresh())
  }

  const hasSelection = selectedIds.size > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            multiple
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v.length ? v : ["ACTIVE"])}
            className="gap-1"
          >
            {["ACTIVE", "RESERVED", "SOLD", "EXPIRED"].map((s) => (
              <ToggleGroupItem key={s} value={s} className="h-7 px-3 text-xs">
                {STATUS_LABELS[s].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {sorts.length > 0 && (
            <Button
              size="sm" variant="ghost" className="h-7 px-3 text-xs text-muted-foreground"
              onClick={() => setSorts([])}
            >
              Reset sort
            </Button>
          )}

          {hasSelection && (
            <Button
              size="sm" variant="outline" className="h-7 px-3 text-xs"
              onClick={() => setSelectedIds(new Set(sorted.map((l) => l.id)))}
            >
              Select all ({sorted.length})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSelection ? (
            <>
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              {!confirmBulkDelete ? (
                <>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={() => bulkUpdateStatus("RESERVED")}>
                    Reserve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={() => bulkUpdateStatus("ACTIVE")}>
                    Unreserve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={() => bulkUpdateStatus("SOLD")}>
                    Sold
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmBulkDelete(true)}>
                    Delete
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={clearSelection}>
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={bulkDelete}>
                    Confirm delete ({selectedIds.size})
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                    onClick={() => setConfirmBulkDelete(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </>
          ) : (
            <Link href="/dashboard/listings/new">
              <Button size="sm">+ Add listing</Button>
            </Link>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground text-sm">
          No listings with the selected status.{" "}
          <Link href="/dashboard/listings/new" className="underline underline-offset-4">Add your first listing →</Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="w-10 px-3 py-2.5" />
                <SortTh col="projectName" label="Project" className="text-left" sorts={sorts} onSort={handleSort} />
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Location</th>
                <SortTh col="bedrooms" label="Beds" className="text-left hidden md:table-cell" sorts={sorts} onSort={handleSort} />
                <SortTh col="price" label="Price" className="text-left" sorts={sorts} onSort={handleSort} />
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Status</th>
                <SortTh col="createdAt" label="Posted" className="text-left hidden lg:table-cell" sorts={sorts} onSort={handleSort} />
                <SortTh col="viewCount" label="Views" className="text-left hidden lg:table-cell" sorts={sorts} onSort={handleSort} />
                <th className="px-4 py-2.5 w-56" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((l, i) => (
                <tr
                  key={l.id}
                  className={cn(
                    "card-animate hover:bg-muted/30 transition-colors",
                    selectedIds.has(l.id) && "bg-muted/20"
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="w-10 px-3 py-3">
                    <Checkbox
                      checked={selectedIds.has(l.id)}
                      onCheckedChange={() => toggleSelect(l.id)}
                      aria-label={`Select ${l.projectName}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/listings/${l.id}`} className="font-medium hover:underline truncate block max-w-[140px]">
                      {l.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{l.location}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatBeds(l.bedrooms)}</td>
                  <td className="px-4 py-3 font-medium tabular-nums">{l.priceLabel ?? formatPrice(l.price)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={STATUS_LABELS[l.status]?.variant ?? "outline"} className="text-xs">
                      {STATUS_LABELS[l.status]?.label ?? l.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {daysAgo(new Date(l.createdAt))}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs tabular-nums">
                    {l.viewCount}
                  </td>
                  <td className="px-4 py-3 w-56">
                    <div className="relative flex items-center justify-end h-7">
                      <div className={cn(
                        "flex items-center gap-1 transition-all duration-150",
                        confirmDeleteId === l.id ? "opacity-0 pointer-events-none" : "opacity-100"
                      )}>
                        <Link href={`/dashboard/listings/${l.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Edit</Button>
                        </Link>
                        {l.status === "ACTIVE" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={isPending}
                            onClick={() => updateStatus(l.id, "RESERVED", l.projectName)}>
                            Reserve
                          </Button>
                        )}
                        {l.status === "RESERVED" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={isPending}
                            onClick={() => updateStatus(l.id, "ACTIVE", l.projectName)}>
                            Unreserve
                          </Button>
                        )}
                        {(l.status === "ACTIVE" || l.status === "RESERVED") && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={isPending}
                            onClick={() => updateStatus(l.id, "SOLD", l.projectName)}>
                            Sold
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
                          disabled={isPending}
                          onClick={() => renewListing(l.id, l.projectName)}>
                          Renew
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(l.id)}>
                          Delete
                        </Button>
                      </div>

                      <div className={cn(
                        "absolute inset-0 flex items-center justify-end gap-1 transition-all duration-150",
                        confirmDeleteId === l.id
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-2 pointer-events-none"
                      )}>
                        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" disabled={isPending}
                          onClick={() => deleteListing(l.id, l.projectName)}>
                          Confirm
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                          onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
