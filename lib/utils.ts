import type { Translate } from "@/lib/i18n"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `AED ${price.toLocaleString("en-AE")}`
}

// `compact` shortens millions ("AED 1.25M") where a card has little room.
export function formatRentPrice(price: number, t: Translate, compact = false): string {
  const amount = compact && price >= 1_000_000 ? `${Number((price / 1_000_000).toFixed(2))}M` : price.toLocaleString("en-AE")
  return `AED ${amount} ${t("/ yr")}`
}

// Stored labels are always English, for example "AED 100,000 / yr".
export function localizePriceLabel(label: string, t: Translate): string {
  return label.replace("/ yr", t("/ yr"))
}

// Converted areas carry decimals ("759.29"); nobody measures a flat to the hundredth.
export function formatArea(sqft: number | null, sqm: number | null, t: Translate): string {
  if (sqft) return t("{n} sqft", { n: Math.round(sqft).toLocaleString("en-US") })
  if (sqm) return t("{n} sqm", { n: Math.round(sqm).toLocaleString("en-US") })
  return "–"
}

// Dubai rents are quoted per year; the monthly figure is what people compare with their salary.
// Rounded to the hundred and marked as approximate when the division isn't clean.
export function formatMonthlyRent(yearly: number, t: Translate): string {
  const exact = yearly / 12
  const rounded = Math.round(exact / 100) * 100
  return `${rounded === exact ? "" : "≈ "}AED ${rounded.toLocaleString("en-AE")} ${t("/ mo")}`
}

// Values that don't repeat their label: "Furnished: Yes", not "Furnished: Furnished".
export function furnishedValue(value: string, t: Translate): string {
  return t(value === "FURNISHED" ? "Yes" : value === "PARTIAL" ? "Partly" : "No")
}

export function floorValue(value: string, t: Translate): string {
  return t(enumLabel(value))
}

// Owners type views as "Burj Khalifa view"; under a "View" label the last word is noise.
export function viewValue(value: string): string {
  return value.replace(/\s+views?$/i, "").trim() || value
}

export function formatBeds(beds: string, t: Translate): string {
  if (beds === "Studio") return t("Studio")
  return t("{n}BR", { n: beds })
}

// "APARTMENT" -> "Apartment", the form the dictionaries use for enum values.
export function enumLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

// Intl gets each language's grammar right ("3 дня назад", "قبل 3 أيام"); digits stay Latin.
export function daysAgo(date: Date, locale: string): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  const format = new Intl.RelativeTimeFormat(`${locale}-u-nu-latn`, { numeric: "auto" }).format(-diff, "day")
  return format.charAt(0).toLocaleUpperCase(locale) + format.slice(1)
}

// The year only matters when the date falls in another year.
export function formatAvailableShort(availableFrom: string | Date, locale: string) {
  const date = new Date(availableFrom)
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear()
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" })
}

// Counts every listing the user has, sold and expired included. Together with
// MAX_PHOTOS_PER_LISTING this caps a user at 120 published photos.
export const MAX_LISTINGS_PER_USER = 10

const HIDDEN_STATUSES = ["EXPIRED", "PENDING_REVIEW", "REJECTED"]

export function isAvailableLater(availableFrom: string | Date | null | undefined) {
  return !!availableFrom && new Date(availableFrom).getTime() > Date.now()
}

export function formatAvailableDate(availableFrom: string | Date, locale: string) {
  return new Date(availableFrom).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}

export function isPublicStatus(status: string) {
  return !HIDDEN_STATUSES.includes(status)
}

export const SUPPORT_EMAIL = "support@pocketlist.ae"
export const EMAIL_FROM = "PocketList <noreply@pocketlist.ae>"
