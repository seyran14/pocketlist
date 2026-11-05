import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `AED ${price.toLocaleString("en-AE")}`
}

export function formatRentPrice(price: number): string {
  return `AED ${price.toLocaleString("en-AE")} / yr`
}

export function formatArea(sqft: number | null, sqm: number | null): string {
  if (sqft) return `${sqft.toLocaleString()} sqft`
  if (sqm) return `${sqm.toLocaleString()} sqm`
  return "—"
}

export function formatBeds(beds: string): string {
  if (beds === "Studio") return "Studio"
  return `${beds}BR`
}

export function daysAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  return `${diff} days ago`
}

// Counts every listing the user has, sold and expired included. Together with
// MAX_PHOTOS_PER_LISTING this caps a user at 120 published photos.
export const MAX_LISTINGS_PER_USER = 10
