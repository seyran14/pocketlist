// Shared by the form and the API, so an owner sees the same rules the server enforces.

export const PUBLIC_FIELDS = [
  "listingType", "projectName", "location", "subLocation", "propertyType", "bedrooms", "bathrooms",
  "areaSqft", "areaSqm", "plotSqft", "plotSqm", "price", "floor", "view", "furnished", "handover",
  "isDistress", "originalPrice", "parkingSpots", "isRented", "rentAmount", "rentedUntil",
  "occupancy", "chequeCount", "availableFrom",
  "securityDeposit", "dewaIncluded", "chiller",
] as const

export const CHILLER_OPTIONS = ["INCLUDED", "EXCLUDED", "NONE"] as const

export const PRIVATE_FIELDS = ["propertyNumber", "amountPaid"] as const

// Changing any of these on an approved listing sends it back to review, because
// they are what was compared with the title deed.
export const VERIFIED_FIELDS = ["projectName", "location", "propertyType", "areaSqft", "areaSqm", "parkingSpots"] as const

type Values = Record<string, unknown>

function pick(body: Values, fields: readonly string[]) {
  return Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]))
}

// The optional rental terms are coerced here so a stray value becomes "not said" (null)
// instead of a database error.
function cleanRentalTerms(data: Values) {
  if ("securityDeposit" in data) {
    const n = Number(data.securityDeposit)
    data.securityDeposit = data.securityDeposit !== null && data.securityDeposit !== "" && Number.isFinite(n) && n >= 0 ? n : null
  }
  if ("dewaIncluded" in data) data.dewaIncluded = typeof data.dewaIncluded === "boolean" ? data.dewaIncluded : null
  if ("chiller" in data) {
    data.chiller = CHILLER_OPTIONS.includes(data.chiller as (typeof CHILLER_OPTIONS)[number]) ? data.chiller : null
  }
  return data
}

export const pickPublicFields = (body: Values) => cleanRentalTerms(pick(body, PUBLIC_FIELDS))
export const pickPrivateFields = (body: Values) => pick(body, PRIVATE_FIELDS)

const filled = (v: unknown) => (typeof v === "string" ? v.trim() !== "" : v !== null && v !== undefined)
const isNumber = (v: unknown) => typeof v === "number" && Number.isFinite(v)

export function showsCheques(values: Values) {
  return values.listingType === "RENT" || values.occupancy === "RENTED"
}

export function missingFields(values: Values) {
  const missing: string[] = []
  const require = (ok: boolean, label: string) => { if (!ok) missing.push(label) }

  require(filled(values.location), "location")
  require(filled(values.projectName), "building name")
  require(filled(values.propertyNumber), "property number")
  require(filled(values.propertyType), "property type")
  require(filled(values.bedrooms), "bedrooms")
  require(filled(values.bathrooms), "bathrooms")
  require(isNumber(values.parkingSpots), "parking")
  require(filled(values.furnished), "furnished or unfurnished")
  require(filled(values.view), "unit view")
  require(filled(values.occupancy), "status")
  require(isNumber(values.price) && (values.price as number) > 0, "asking price")
  require(filled(values.deedId), "title deed")

  if (values.occupancy === "OFFPLAN") {
    require(filled(values.handover), "handover date")
    require(isNumber(values.amountPaid), "amount paid to the developer")
  }
  if (values.occupancy === "RENTED") require(isValidDate(values.availableFrom), "available from date")
  require(isNumber(values.chequeCount), "number of cheques")

  return missing
}

// The price label and the title are built from other fields, so they follow any change to those.
export function applyDerivedFields(data: Values, listing: { listingType: string; bedrooms: string; location: string; price: number }) {
  const isRent = (data.listingType ?? listing.listingType) === "RENT"

  if (data.price !== undefined) {
    data.priceLabel = isRent
      ? `AED ${Number(data.price).toLocaleString("en-AE")} / yr`
      : `AED ${Number(data.price).toLocaleString("en-AE")}`
  }

  const beds = (data.bedrooms ?? listing.bedrooms) as string
  const loc = (data.location ?? listing.location) as string
  const price = (data.price ?? listing.price) as number
  const bedsLabel = beds === "Studio" ? "Studio" : `${beds}BR`
  if (data.bedrooms !== undefined || data.location !== undefined || data.price !== undefined || data.listingType !== undefined) {
    data.title = isRent
      ? `${bedsLabel} in ${loc} – AED ${Math.round(price / 1000)}K/yr`
      : `${bedsLabel} in ${loc} – AED ${Math.round(price / 1000)}K`
  }
}

export function isValidDate(value: unknown) {
  if (value instanceof Date) return true
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

// availableFrom is always set here, so the date string from the form never reaches the database.
export function occupancyFields(occupancy: unknown, availableFrom?: unknown) {
  if (occupancy === "VACANT") return { isRented: false, handover: "Ready", availableFrom: null }
  if (occupancy === "RENTED") {
    const date = isValidDate(availableFrom) ? new Date(availableFrom as string | Date) : undefined
    return { isRented: true, handover: "Ready", availableFrom: date }
  }
  if (occupancy === "OFFPLAN") return { isRented: false, availableFrom: null }
  return { availableFrom: undefined }
}

// Null or a past date means free now, so a home turns "available" without anyone editing it.
export function availabilityWhere(status: string | null | undefined, availableBy: string | null | undefined) {
  const now = new Date()
  if (status === "now") return { OR: [{ availableFrom: null }, { availableFrom: { lte: now } }] }
  if (status !== "soon") return {}
  const by = availableBy && isValidDate(availableBy) ? new Date(`${availableBy}T23:59:59.999Z`) : undefined
  return { availableFrom: { gt: now, ...(by && !Number.isNaN(by.getTime()) ? { lte: by } : {}) } }
}
