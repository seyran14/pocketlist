"use client"

import { cn, enumLabel, formatBeds } from "@/lib/utils"
import { useT } from "@/components/I18nProvider"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
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
  { value: "now", label: "Available now" },
  { value: "soon", label: "Available soon" },
]
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "area_asc", label: "Area ↑" },
  { value: "area_desc", label: "Area ↓" },
]

const PILL = "h-8 rounded-full! border border-input bg-card px-3 text-xs aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:aria-pressed:bg-primary hover:aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"

export function ListingFilters() {
  const t = useT()
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isMounted = useRef(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // When the URL changes from outside (back button, a link), copy it into the inputs.
  // Done during render rather than in an effect, so there is no extra render pass.
  const urlKey = searchParams.toString()
  const [syncedUrl, setSyncedUrl] = useState(urlKey)
  if (syncedUrl !== urlKey) {
    setSyncedUrl(urlKey)
    setQuery(current("q"))
    setPriceMin(current("priceMin"))
    setPriceMax(current("priceMax"))
  }

  // Debounce search query
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    searchTimer.current = setTimeout(() => update("q", query.trim() || null), 400)
    return () => clearTimeout(searchTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const status = current("status")
  const today = new Date().toISOString().slice(0, 10)

  const changeStatus = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set("status", next)
    else params.delete("status")
    params.delete("availableBy")
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasFilters = ["q", "propertyType", "bedrooms", "priceMin", "priceMax", "status", "listingType"].some(
    (k) => searchParams.get(k)
  )
  const activeFilters =
    ["propertyType", "bedrooms", "status"].filter((k) => searchParams.get(k)).length +
    (searchParams.get("priceMin") || searchParams.get("priceMax") ? 1 : 0)

  return (
    <div className="flex flex-col gap-4 py-2">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); clearTimeout(searchTimer.current); update("q", query.trim() || null) }}
        className="relative w-full rounded-2xl border border-input bg-card"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Building or area")}
          aria-label={t("Building or area")}
          className="h-14 w-full rounded-2xl bg-transparent ps-5 pe-32 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            className="absolute end-[6.5rem] top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); update("q", null) }}
            aria-label={t("Clear search")}
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute end-2 top-1/2 flex h-10 -translate-y-1/2 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.97]"
        >
          <Search className="size-4" />
          {t("Search")}
        </button>
      </form>

      <div className={cn("flex items-center", !hasFilters && "sm:hidden")}>
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="listing-filters"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex h-10 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm font-medium sm:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("Filters")}
          {activeFilters > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-muted-foreground ms-auto"
            onClick={() => router.push(pathname)}>{t("Clear")}</Button>
        )}
      </div>

      <div id="listing-filters" className={cn("flex flex-col gap-4", !filtersOpen && "hidden sm:flex")}>
        {/* One left-aligned line of groups that wraps, so the eye reads them in order. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-8 sm:gap-y-4">
          <div className="contents">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{t("Sort")}</Label>
              <Select
                value={current("sort") || "newest"}
                onValueChange={(v) => update("sort", v === "newest" ? null : v)}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <span>{t(SORT_OPTIONS.find((o) => o.value === (current("sort") || "newest"))?.label ?? "Newest")}</span>
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{t("Rent (AED / yr)")}</Label>
              <div className="flex items-center gap-1">
                <Input type="number" placeholder={t("Min")} aria-label={t("Minimum rent, AED a year")} className="h-8 w-24 bg-card text-xs"
                  value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
                  onBlur={(e) => update("priceMin", e.target.value || null)} />
                <span className="text-muted-foreground text-xs">–</span>
                <Input type="number" placeholder={t("Max")} aria-label={t("Maximum rent, AED a year")} className="h-8 w-24 bg-card text-xs"
                  value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
                  onBlur={(e) => update("priceMax", e.target.value || null)} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("Property type")}</Label>
            <ToggleGroup
              multiple
              className="flex-wrap justify-start gap-1"
              value={current("propertyType") ? (current("propertyType").split(",") as string[]) : []}
              onValueChange={(v) => update("propertyType", v.length ? v.join(",") : null)}
            >
              {PROPERTY_TYPES.map((type) => (
                <ToggleGroupItem key={type} value={type} className={PILL}>
                  {t(enumLabel(type))}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("Bedrooms")}</Label>
            <ToggleGroup
              multiple
              className="flex-wrap justify-start gap-1"
              value={current("bedrooms") ? (current("bedrooms").split(",") as string[]) : []}
              onValueChange={(v) => update("bedrooms", v.length ? v.join(",") : null)}
            >
              {BEDROOM_OPTIONS.map((b) => (
                <ToggleGroupItem key={b} value={b} className={PILL}>
                  {formatBeds(b, t)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("Status")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              {status === "soon" && (
                <DatePicker
                  label={t("Free by")}
                  min={today}
                  clearable
                  className="w-40 text-xs"
                  value={current("availableBy")}
                  onChange={(day) => update("availableBy", day || null)}
                />
              )}
              <ToggleGroup
                className="justify-start gap-1"
                value={status ? [status] : []}
                onValueChange={(v) => changeStatus(v[v.length - 1] ?? null)}
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <ToggleGroupItem key={value} value={value} className={PILL}>
                    {t(label)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
