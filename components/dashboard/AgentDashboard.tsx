"use client"

import { useT } from "@/components/I18nProvider"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn, formatPrice, formatBeds, daysAgo, localizePriceLabel } from "@/lib/utils"
import { toast } from "sonner"

type Listing = {
  id: string
  projectName: string
  location: string
  bedrooms: string
  price: number
  priceLabel: string | null
  status: string
  listingType: string
  createdAt: string
  viewCount: number
  review: { note: string | null } | null
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
  PENDING_REVIEW: { label: "In Review", variant: "secondary" },
  REJECTED: { label: "Needs Changes", variant: "destructive" },
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
    <th className={cn("px-2.5 py-2.5 font-medium", className)}>
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
  const t = useT()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string[]>(["ACTIVE", "RESERVED", "PENDING_REVIEW", "REJECTED"])
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
      toast.success(t("{name}: {status}", { name, status: t(STATUS_LABELS[status]?.label ?? status) }))
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
      toast.success(t("{name} renewed for 30 days", { name }))
      startTransition(() => router.refresh())
    }
  }

  async function deleteListing(id: string, name: string) {
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) {
      toast.success(t("{name} deleted", { name }))
      setConfirmDeleteId(null)
      startTransition(() => router.refresh())
    }
  }

  async function bulkUpdateStatus(status: string) {
    // Listings under review only change status through the reviewer.
    const ids = listings
      .filter((l) => selectedIds.has(l.id) && !["PENDING_REVIEW", "REJECTED"].includes(l.status))
      .map((l) => l.id)
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    )
    toast.success(t("Updated: {n}", { n: ids.length }))
    clearSelection()
    startTransition(() => router.refresh())
  }

  async function bulkDelete() {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/listings/${id}`, { method: "DELETE" })
      )
    )
    toast.success(t("Deleted: {n}", { n: selectedIds.size }))
    clearSelection()
    startTransition(() => router.refresh())
  }

  const hasSelection = selectedIds.size > 0

  const price = (l: Listing) => (l.priceLabel ? localizePriceLabel(l.priceLabel, t) : formatPrice(l.price))
  const statusBadge = (status: string) => (
    <Badge variant={STATUS_LABELS[status]?.variant ?? "outline"} className="text-xs">
      {t(STATUS_LABELS[status]?.label ?? status)}
    </Badge>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            multiple
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v.length ? v : ["ACTIVE"])}
            className="max-w-full flex-wrap gap-1"
          >
            {["ACTIVE", "RESERVED", "PENDING_REVIEW", "REJECTED", "SOLD", "EXPIRED"].map((s) => (
              <ToggleGroupItem key={s} value={s} className="h-7 px-3 text-xs">
                {t(STATUS_LABELS[s].label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {sorts.length > 0 && (
            <Button
              size="sm" variant="ghost" className="h-7 px-3 text-xs text-muted-foreground"
              onClick={() => setSorts([])}
            >
              {t("Reset sort")}
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

        <div className="flex flex-wrap items-center gap-2">
          {hasSelection ? (
            <>
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              {!confirmBulkDelete ? (
                <>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={() => bulkUpdateStatus("RESERVED")}>
                    {t("Reserve")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={() => bulkUpdateStatus("ACTIVE")}>
                    {t("Unreserve")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isPending}
                    onClick={() => bulkUpdateStatus("SOLD")}>
                    {t("Sold")}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmBulkDelete(true)}>
                    {t("Delete")}
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
                    {t("Cancel")}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Link href="/dashboard/listings/new">
              <Button size="sm">{t("+ Add listing")}</Button>
            </Link>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground text-sm">
          No listings with the selected status.{" "}
          <Link href="/dashboard/listings/new" className="underline underline-offset-4">{t("Add your first listing →")}</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="w-10 px-3 py-2.5" />
                <SortTh col="projectName" label={t("Project")} className="text-start" sorts={sorts} onSort={handleSort} />
                <th className="text-start px-2.5 py-2.5 font-medium hidden lg:table-cell">{t("Location")}</th>
                <SortTh col="bedrooms" label={t("Beds")} className="text-start hidden md:table-cell" sorts={sorts} onSort={handleSort} />
                <SortTh col="price" label={t("Price")} className="text-start hidden sm:table-cell" sorts={sorts} onSort={handleSort} />
                <th className="text-start px-2.5 py-2.5 font-medium hidden sm:table-cell">{t("Status")}</th>
                <SortTh col="createdAt" label={t("Posted")} className="text-start hidden lg:table-cell" sorts={sorts} onSort={handleSort} />
                <SortTh col="viewCount" label={t("Views")} className="text-start hidden lg:table-cell" sorts={sorts} onSort={handleSort} />
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
                  <td className="w-10 px-3 py-3 align-top">
                    <Checkbox
                      checked={selectedIds.has(l.id)}
                      onCheckedChange={() => toggleSelect(l.id)}
                      aria-label={t("Select {name}", { name: l.projectName })}
                    />
                  </td>
                  <td className="px-2.5 py-3">
                    <Link href={`/listings/${l.id}`} className="block font-medium [overflow-wrap:anywhere] hover:underline">
                      {l.projectName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                      <span className="text-sm font-medium tabular-nums">{price(l)}</span>
                      {statusBadge(l.status)}
                    </div>
                    {l.status === "REJECTED" && l.review?.note && (
                      <Link href={`/dashboard/listings/${l.id}/edit`} className="mt-0.5 block text-xs text-destructive [overflow-wrap:anywhere] hover:underline">
                        {l.review.note}
                      </Link>
                    )}
                    <div className="relative mt-2 min-h-7 sm:-ms-2 sm:mt-1.5">
                      <div className={cn(
                        "flex flex-wrap items-center gap-1.5 transition-all sm:gap-x-0.5 sm:gap-y-0 duration-150",
                        confirmDeleteId === l.id ? "opacity-0 pointer-events-none" : "opacity-100"
                      )}>
                        <Link href={`/dashboard/listings/${l.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border">{t("Edit")}</Button>
                        </Link>
                        {l.listingType === "RENT" && (l.status === "ACTIVE" || l.status === "RESERVED") && (
                          <Link href={`/dashboard/listings/${l.id}/contract`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs max-sm:border-border">{t("Contract")}</Button>
                          </Link>
                        )}
                        {l.status === "ACTIVE" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border" disabled={isPending}
                            onClick={() => updateStatus(l.id, "RESERVED", l.projectName)}>
                            {t("Reserve")}
                          </Button>
                        )}
                        {l.status === "RESERVED" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border" disabled={isPending}
                            onClick={() => updateStatus(l.id, "ACTIVE", l.projectName)}>
                            {t("Unreserve")}
                          </Button>
                        )}
                        {(l.status === "ACTIVE" || l.status === "RESERVED") && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border" disabled={isPending}
                            onClick={() => updateStatus(l.id, "SOLD", l.projectName)}>
                            {t("Sold")}
                          </Button>
                        )}
                        {l.status === "SOLD" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border" disabled={isPending}
                            onClick={() => updateStatus(l.id, "ACTIVE", l.projectName)}>
                            {t("Unsold")}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border text-muted-foreground"
                          disabled={isPending}
                          onClick={() => renewListing(l.id, l.projectName)}>
                          {t("Renew")}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border text-destructive hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(l.id)}>
                          {t("Delete")}
                        </Button>
                      </div>

                      <div className={cn(
                        "absolute inset-0 flex items-start gap-1.5 transition-all sm:ps-2 duration-150",
                        confirmDeleteId === l.id
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none"
                      )}>
                        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs max-sm:border-border" disabled={isPending}
                          onClick={() => deleteListing(l.id, l.projectName)}>
                          {t("Confirm")}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs max-sm:border-border"
                          onClick={() => setConfirmDeleteId(null)}>
                          {t("Cancel")}
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-3 hidden lg:table-cell align-top text-muted-foreground">{l.location}</td>
                  <td className="px-2.5 py-3 hidden md:table-cell align-top text-muted-foreground">{formatBeds(l.bedrooms, t)}</td>
                  <td className="hidden whitespace-nowrap px-2.5 py-3 align-top font-medium tabular-nums sm:table-cell">{price(l)}</td>
                  <td className="px-2.5 py-3 hidden sm:table-cell align-top">{statusBadge(l.status)}</td>
                  <td className="px-2.5 py-3 hidden lg:table-cell align-top text-muted-foreground text-xs">
                    {daysAgo(new Date(l.createdAt), t)}
                  </td>
                  <td className="px-2.5 py-3 hidden lg:table-cell align-top text-muted-foreground text-xs tabular-nums">
                    {l.viewCount}
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
