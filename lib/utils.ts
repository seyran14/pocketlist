import type { Translate } from "@/lib/i18n"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `AED ${price.toLocaleString("en-AE")}`
}

export function formatRentPrice(price: number, t: Translate): string {
  return `AED ${price.toLocaleString("en-AE")} ${t("/ yr")}`
}

// Stored labels are always English, for example "AED 100,000 / yr".
export function localizePriceLabel(label: string, t: Translate): string {
  return label.replace("/ yr", t("/ yr"))
}

export function formatArea(sqft: number | null, sqm: number | null, t: Translate): string {
  if (sqft) return t("{n} sqft", { n: sqft.toLocaleString("en-US") })
  if (sqm) return t("{n} sqm", { n: sqm.toLocaleString("en-US") })
  return "—"
}

export function formatBeds(beds: string, t: Translate): string {
  if (beds === "Studio") return t("Studio")
  return t("{n}BR", { n: beds })
}

// "APARTMENT" -> "Apartment", the form the dictionaries use for enum values.
export function enumLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

export function daysAgo(date: Date, t: Translate): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (diff === 0) return t("Today")
  if (diff === 1) return t("Yesterday")
  return t("{n} days ago", { n: diff })
}

// Counts every listing the user has, sold and expired included. Together with
// MAX_PHOTOS_PER_LISTING this caps a user at 120 published photos.
export const MAX_LISTINGS_PER_USER = 10

const HIDDEN_STATUSES = ["EXPIRED", "PENDING_REVIEW", "REJECTED"]

export function isPublicStatus(status: string) {
  return !HIDDEN_STATUSES.includes(status)
}

export const SUPPORT_EMAIL = "support@pocketlist.ae"
export const EMAIL_FROM = "PocketList <noreply@pocketlist.ae>"
