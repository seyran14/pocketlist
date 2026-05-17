"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const PROPERTY_TYPES = ["APARTMENT", "TOWNHOUSE", "VILLA", "PENTHOUSE", "DUPLEX"]
const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4", "5+"]
const STATUS_OPTIONS = [
  { value: "ready", label: "Ready" },
  { value: "offplan", label: "Off-plan" },
  { value: "distress", label: "Distress" },
]
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "area_asc", label: "Area ↑" },
  { value: "area_desc", label: "Area ↓" },
]

export function ListingFilters({ locations: _locations }: { locations: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const current = (key: string) => searchParams.get(key) ?? ""

  const [query, setQuery] = useState(current("q"))
  const [priceMin, setPriceMin] = useState(current("priceMin"))
  const [priceMax, setPriceMax] = useState(current("priceMax"))
  const isMounted = useRef(false)

  // Sync external URL changes back into local state
  useEffect(() => {
    setQuery(current("q"))
    setPriceMin(current("priceMin"))
    setPriceMax(current("priceMax"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Debounce search query
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    const timer = setTimeout(() => update("q", query.trim() || null), 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const listingType = current("listingType")
  const isRent = listingType === "RENT"

  const hasFilters = ["q", "propertyType", "bedrooms", "priceMin", "priceMax", "status", "listingType"].some(
    (k) => searchParams.get(k)
  )

  return (
    <div className="flex flex-col gap-4 py-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, locations…"
          className="pl-9 pr-8 h-10 text-sm"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setQuery(""); update("q", null) }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sale / Rent primary toggle */}
      <div className="flex gap-1">
        <Button
          variant={!listingType ? "default" : "outline"}
          size="sm"
          className="h-8 px-4 text-sm"
          onClick={() => update("listingType", null)}
        >
          All
        </Button>
        <Button
          variant={listingType === "SALE" ? "default" : "outline"}
          size="sm"
          className="h-8 px-4 text-sm"
          onClick={() => update("listingType", "SALE")}
        >
          For Sale
        </Button>
        <Button
          variant={listingType === "RENT" ? "default" : "outline"}
          size="sm"
          className="h-8 px-4 text-sm"
          onClick={() => update("listingType", "RENT")}
        >
          For Rent
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
        {/* Sort */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Sort</Label>
          <Select
            value={current("sort") || "newest"}
            onValueChange={(v) => update("sort", v === "newest" ? null : v)}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <span>
                {SORT_OPTIONS.find((o) => o.value === (current("sort") || "newest"))?.label ?? "Newest"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <Label className="text-xs text-muted-foreground">
            {isRent ? "Annual rent (AED)" : "Price (AED)"}
          </Label>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Input
              type="number"
              placeholder="Min"
              className="h-8 w-0 min-w-0 flex-1 sm:flex-none sm:w-28 text-sm"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={(e) => update("priceMin", e.target.value || null)}
            />
            <span className="text-muted-foreground text-xs shrink-0">—</span>
            <Input
              type="number"
              placeholder="Max"
              className="h-8 w-0 min-w-0 flex-1 sm:flex-none sm:w-28 text-sm"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={(e) => update("priceMax", e.target.value || null)}
            />
          </div>
        </div>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground self-end"
            onClick={() => router.push(pathname)}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Property type */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Property type</Label>
        <ToggleGroup
          multiple
          className="flex-wrap justify-start gap-1"
          value={current("propertyType") ? (current("propertyType").split(",") as string[]) : []}
          onValueChange={(v) => update("propertyType", v.length ? v.join(",") : null)}
        >
          {PROPERTY_TYPES.map((t) => (
            <ToggleGroupItem key={t} value={t} className="h-7 px-3 text-xs capitalize">
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Bedrooms */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Bedrooms</Label>
        <ToggleGroup
          multiple
          className="flex-wrap justify-start gap-1"
          value={current("bedrooms") ? (current("bedrooms").split(",") as string[]) : []}
          onValueChange={(v) => update("bedrooms", v.length ? v.join(",") : null)}
        >
          {BEDROOM_OPTIONS.map((b) => (
            <ToggleGroupItem key={b} value={b} className="h-7 w-14 text-xs">
              {b === "Studio" ? "Studio" : `${b}BR`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Status — only for sale listings */}
      {!isRent && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <ToggleGroup
            className="justify-start gap-1"
            value={current("status") ? [current("status")] : []}
            onValueChange={(v) => update("status", v[v.length - 1] ?? null)}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <ToggleGroupItem key={value} value={value} className="h-7 px-3 text-xs">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}
    </div>
  )
}
