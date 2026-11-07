"use client"

import { useT } from "@/components/I18nProvider"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { DocumentUploader, type UploadedDocument } from "@/components/listings/DocumentUploader"
import { PhotoUploader } from "@/components/listings/PhotoUploader"
import { compareDeed, type DeedFields } from "@/lib/deed-shared"
import { showsCheques } from "@/lib/listing-rules"
import { DatePicker } from "@/components/ui/date-picker"
import { cn, formatBeds } from "@/lib/utils"
import type { ParsedListing } from "@/lib/ai"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment", TOWNHOUSE: "Townhouse", VILLA: "Villa",
  PENTHOUSE: "Penthouse", DUPLEX: "Duplex",
}
const FLOOR_LABELS: Record<string, string> = { LOW: "Low", MIDDLE: "Middle", HIGH: "High" }
const FURNISHED_LABELS: Record<string, string> = {
  FURNISHED: "Furnished", UNFURNISHED: "Unfurnished", PARTIAL: "Partial",
}

const OCCUPANCY_LABELS: Record<string, string> = { VACANT: "Available now", RENTED: "Available soon", OFFPLAN: "Off-plan" }

export type UnitFormValues = {
  listingType: "SALE" | "RENT"
  projectName: string
  location: string
  propertyType: "APARTMENT" | "TOWNHOUSE" | "VILLA" | "PENTHOUSE" | "DUPLEX"
  bedrooms: string | null
  bathrooms: string | null
  areaSqft: number | null
  areaSqm: number | null
  plotSqft: number | null
  plotSqm: number | null
  price: number | null
  floor: "LOW" | "MIDDLE" | "HIGH" | null
  view: string | null
  furnished: "FURNISHED" | "UNFURNISHED" | "PARTIAL" | null
  handover: string | null
  isDistress: boolean
  originalPrice: number | null
  isRented: boolean
  rentAmount: number | null
  notes: string | null
  photoIds: string[]
  propertyNumber: string
  parkingSpots: number | null
  occupancy: "VACANT" | "RENTED" | "OFFPLAN" | null
  availableFrom: string | null
  chequeCount: number | null
  amountPaid: number | null
  deedId: string | null
}

export type UnitData = ParsedListing & Partial<Pick<
  UnitFormValues,
  "propertyNumber" | "parkingSpots" | "occupancy" | "availableFrom" | "chequeCount" | "amountPaid"
>> & {
  photos?: { id: string }[]
  deed?: { id: string; fileName: string } | null
}

function defaultOccupancy(data: UnitData): UnitFormValues["occupancy"] {
  if (data.occupancy === "VACANT" || data.occupancy === "RENTED") return data.occupancy
  if (data.isRented) return "RENTED"
  return data.handover && /ready/i.test(data.handover) ? "VACANT" : null
}

type Props = {
  index: number
  total: number
  data: UnitData
  onChange: (index: number, values: UnitFormValues) => void
  onRemove: (index: number) => void
  onUploadingChange?: (uploading: boolean) => void
  ownerTools?: boolean
}

function Hint({ children, level = "warn" }: { children: string; level?: "warn" | "info" }) {
  return (
    <p className={cn("text-xs mt-0.5", level === "warn" ? "text-amber-600" : "text-muted-foreground")}>
      {level === "warn" ? "⚠ " : "ℹ "}{children}
    </p>
  )
}

export function ParsedUnitCard({ index, total, data, onChange, onRemove, onUploadingChange, ownerTools = true }: Props) {
  const t = useT()
  const { register, watch, setValue, getValues } = useForm<UnitFormValues>({
    defaultValues: {
      listingType: data.listingType ?? "SALE",
      projectName: data.projectName ?? "",
      location: data.location ?? "",
      propertyType: data.propertyType ?? "APARTMENT",
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      areaSqft: data.areaSqft ?? null,
      areaSqm: data.areaSqm ?? null,
      plotSqft: data.plotSqft ?? null,
      plotSqm: data.plotSqm ?? null,
      price: data.price ?? null,
      floor: data.floor ?? null,
      view: data.view ?? null,
      furnished: data.furnished ?? null,
      handover: data.handover ?? null,
      isDistress: data.isDistress ?? false,
      originalPrice: data.originalPrice ?? null,
      isRented: data.isRented ?? false,
      rentAmount: data.rentAmount ?? null,
      notes: data.notes ?? null,
      photoIds: data.photos?.map((p) => p.id) ?? [],
      propertyNumber: data.propertyNumber ?? "",
      parkingSpots: data.parkingSpots ?? null,
      occupancy: defaultOccupancy(data),
      availableFrom: data.availableFrom?.slice(0, 10) ?? null,
      chequeCount: data.chequeCount ?? null,
      amountPaid: data.amountPaid ?? null,
      deedId: data.deed?.id ?? null,
    },
  })
  const [deedFile, setDeedFile] = useState(data.deed ?? null)
  const [deedFields, setDeedFields] = useState<DeedFields | null>(null)
  const [deedUnreadable, setDeedUnreadable] = useState(false)

  const watched = watch()
  const listingType = watch("listingType")
  const isRent = listingType === "RENT"
  const isDistress = watch("isDistress")
  const occupancy = watch("occupancy")
  const price = watch("price")
  const areaSqft = watch("areaSqft")

  useEffect(() => {
    onChange(index, getValues())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched)])

  // Only what was actually read from the deed: a blank field isn't a mismatch here.
  const deedMismatches = deedFields
    ? compareDeed(watched, deedFields, "-").filter((c) => c.result === "mismatch" && c.found !== "Not found")
    : []

  function handleDeed(document: UploadedDocument) {
    setValue("deedId", document.id)
    setDeedFile({ id: document.id, fileName: document.fileName })
    setDeedFields(document.fields ?? null)
    setDeedUnreadable(!document.hasText)

    const fields = document.fields
    if (!fields) return
    const fillBlank = (key: "propertyNumber" | "projectName" | "location" | "areaSqft" | "areaSqm" | "parkingSpots", value: string | number | null) => {
      const current = getValues(key)
      const isBlank = current === null || current === "" || Number.isNaN(current)
      if (isBlank && value !== null) setValue(key, value as never)
    }
    fillBlank("propertyNumber", fields.propertyNumber)
    fillBlank("projectName", fields.buildingName)
    fillBlank("location", fields.community)
    fillBlank("areaSqft", fields.areaSqft)
    fillBlank("areaSqm", fields.areaSqm)
    if (fields.parkings) fillBlank("parkingSpots", fields.parkings.split(/[,;]/).length)
  }

  function syncSqm(sqft: number | null) {
    if (sqft) setValue("areaSqm", Math.round(sqft / 10.764))
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t("Unit {n} of {total}", { n: index + 1, total })}
        </span>
        {total > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            {t("Remove")}
          </Button>
        )}
      </div>

      <PhotoUploader
        initialIds={data.photos?.map((p) => p.id) ?? []}
        onChange={(ids) => setValue("photoIds", ids)}
        onUploadingChange={onUploadingChange}
        canUpload={ownerTools}
      />

      {ownerTools && <div className="ph-no-capture space-y-2">
        <DocumentUploader
          kind="TITLE_DEED"
          label="Title deed"
          hint="PDF, Word or a photo. We'll fill in what we can read."
          accept="application/pdf,.docx,image/*,.heic,.heif"
          current={deedFile}
          onUploaded={handleDeed}
          onUploadingChange={onUploadingChange}
        />
        {deedUnreadable && (
          <Hint level="info">{t("We couldn't read this file automatically. A reviewer will check it by hand.")}</Hint>
        )}
        {deedMismatches.map((check) => (
          <Hint key={check.key}>{t("{label} doesn't match the deed: {found}", { label: t(check.label), found: check.found })}</Hint>
        ))}
      </div>}

      <div className="grid grid-cols-2 gap-3">
        {/* Location */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">{t("Location")}</Label>
          <Input {...register("location")} className="h-8 text-sm mt-1" />
        </div>

        {/* Building */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">{t("Building name")}</Label>
          <Input {...register("projectName")} className="h-8 text-sm mt-1" />
        </div>

        {/* Property number */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">{t("Property number")}</Label>
          <Input {...register("propertyNumber")} className="h-8 text-sm mt-1" placeholder={t("Not shown to buyers")} />
        </div>

        {/* Property type */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">{t("Property type")}</Label>
          <Select
            value={watch("propertyType")}
            onValueChange={(v) => v && setValue("propertyType", v as UnitFormValues["propertyType"])}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <span>{t(PROPERTY_TYPE_LABELS[watch("propertyType")] ?? watch("propertyType"))}</span>
            </SelectTrigger>
            <SelectContent>
              {(["APARTMENT", "TOWNHOUSE", "VILLA", "PENTHOUSE", "DUPLEX"] as const).map((type) => (
                <SelectItem key={type} value={type}>{t(PROPERTY_TYPE_LABELS[type])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Bedrooms")}</Label>
          <Select
            value={watch("bedrooms") ?? ""}
            onValueChange={(v) => setValue("bedrooms", v || null)}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <span>{watch("bedrooms") ? formatBeds(watch("bedrooms")!, t) : "–"}</span>
            </SelectTrigger>
            <SelectContent>
              {["Studio", "1", "2", "3", "4", "5+"].map((b) => (
                <SelectItem key={b} value={b}>{formatBeds(b, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bathrooms */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Bathrooms")}</Label>
          <Input {...register("bathrooms")} className="h-8 text-sm mt-1" placeholder="–" />
        </div>

        {/* Parking */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Parking spaces")}</Label>
          <Input
            {...register("parkingSpots", { valueAsNumber: true })}
            type="number"
            min={0}
            className="h-8 text-sm mt-1"
          />
        </div>

        {/* Furnished */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Furnished")}</Label>
          <Select
            value={watch("furnished") ?? ""}
            onValueChange={(v) => setValue("furnished", (v || null) as UnitFormValues["furnished"])}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <span>{watch("furnished") ? t(FURNISHED_LABELS[watch("furnished")!]) : "–"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FURNISHED">{t("Furnished")}</SelectItem>
              <SelectItem value="UNFURNISHED">{t("Unfurnished")}</SelectItem>
              <SelectItem value="PARTIAL">{t("Partial")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Unit view")}</Label>
          <Input {...register("view")} className="h-8 text-sm mt-1" placeholder={t("e.g. Canal, Sea")} />
        </div>

        {/* Status */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Status")}</Label>
          <Select
            value={occupancy ?? ""}
            onValueChange={(v) => setValue("occupancy", (v || null) as UnitFormValues["occupancy"])}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <span>{occupancy ? t(OCCUPANCY_LABELS[occupancy]) : "–"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VACANT">{t("Available now")}</SelectItem>
              <SelectItem value="RENTED">{t("Available soon")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {occupancy === "RENTED" && (
          <div>
            <Label htmlFor={`available-from-${index}`} className="text-xs text-muted-foreground">{t("Available from")}</Label>
            <DatePicker
              id={`available-from-${index}`}
              label={t("Available from")}
              min={new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full"
              value={watch("availableFrom") ?? ""}
              onChange={(day) => setValue("availableFrom", day)}
            />
          </div>
        )}

        {occupancy === "RENTED" && !isRent && (
          <div>
            <Label className="text-xs text-muted-foreground">{t("Annual rent (AED)")}</Label>
            <Input
              {...register("rentAmount", { valueAsNumber: true })}
              type="number"
              className="h-8 text-sm mt-1"
            />
          </div>
        )}

        {/* Price */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">
            {isRent ? t("Asking rent, per year (AED)") : t("Asking price (AED)")}
          </Label>
          {!price && <Hint>{t("Adding a price gets 3× more views")}</Hint>}
          <Input
            {...register("price", { valueAsNumber: true })}
            type="number"
            className="h-8 text-sm mt-1"
            placeholder={t("e.g. 1500000")}
          />
        </div>

        {showsCheques(watched) && (
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs text-muted-foreground">{t("Number of cheques")}</Label>
            <Input
              {...register("chequeCount", { valueAsNumber: true })}
              type="number"
              min={1}
              className="h-8 text-sm mt-1"
            />
          </div>
        )}

        {/* Area sqft */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("BUA (built-up area), sqft")}</Label>
          {!areaSqft && <Hint>{t("Tenants filter by size, so add the area if you know it")}</Hint>}
          <Input
            {...register("areaSqft", { valueAsNumber: true })}
            type="number"
            className="h-8 text-sm mt-1"
            onBlur={(e) => syncSqm(parseFloat(e.target.value) || null)}
          />
        </div>

        {/* Area sqm */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("BUA (built-up area), sqm")}</Label>
          <Input
            {...register("areaSqm", { valueAsNumber: true })}
            type="number"
            className="h-8 text-sm mt-1"
          />
        </div>

        {/* Plot sqft */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Plot (sqft)")}</Label>
          <Input
            {...register("plotSqft", { valueAsNumber: true })}
            type="number"
            className="h-8 text-sm mt-1"
            placeholder={t("Villas / townhouses")}
          />
        </div>

        {/* Plot sqm */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Plot (sqm)")}</Label>
          <Input
            {...register("plotSqm", { valueAsNumber: true })}
            type="number"
            className="h-8 text-sm mt-1"
          />
        </div>

        {/* Floor */}
        <div>
          <Label className="text-xs text-muted-foreground">{t("Floor")}</Label>
          {!watch("floor") && <Hint level="info">{t("Floor level helps buyers decide quickly")}</Hint>}
          <Select
            value={watch("floor") ?? ""}
            onValueChange={(v) => setValue("floor", (v || null) as UnitFormValues["floor"])}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <span>{watch("floor") ? t(FLOOR_LABELS[watch("floor")!]) : "–"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">{t("Low")}</SelectItem>
              <SelectItem value="MIDDLE">{t("Middle")}</SelectItem>
              <SelectItem value="HIGH">{t("High")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Distress */}
        <div className="col-span-2 flex items-center gap-2">
          <Checkbox
            id={`distress-${index}`}
            checked={isDistress}
            onCheckedChange={(c) => setValue("isDistress", !!c)}
          />
          <Label htmlFor={`distress-${index}`} className="text-sm cursor-pointer">
            {t("Distress deal (below OP price)")}
          </Label>
        </div>

        {isDistress && (
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs text-muted-foreground">{t("Original price (OP)")}</Label>
            <Input
              {...register("originalPrice", { valueAsNumber: true })}
              type="number"
              className="h-8 text-sm mt-1"
              placeholder={t("OP price")}
            />
          </div>
        )}

        {/* Notes */}
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">{t("Notes (optional)")}</Label>
          <Textarea
            {...register("notes")}
            className="text-sm mt-1 min-h-16 resize-none"
            placeholder={t("Any additional details…")}
          />
        </div>
      </div>
    </div>
  )
}
