// Shared by the form and the API, so an owner sees the same rules the server enforces.

export const PUBLIC_FIELDS = [
  "listingType", "projectName", "location", "subLocation", "propertyType", "bedrooms", "bathrooms",
  "areaSqft", "areaSqm", "plotSqft", "plotSqm", "price", "floor", "view", "furnished", "handover",
  "isDistress", "originalPrice", "parkingSpots", "isRented", "rentAmount", "rentedUntil",
  "occupancy", "chequeCount", "availableFrom",
] as const

export const PRIVATE_FIELDS = ["propertyNumber", "amountPaid"] as const

// Changing any of these on an approved listing sends it back to review, because
// they are what was compared with the title deed.
export const VERIFIED_FIELDS = ["projectName", "location", "propertyType", "areaSqft", "areaSqm", "parkingSpots"] as const

type Values = Record<string, unknown>

function pick(body: Values, fields: readonly string[]) {
  return Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]))
}

export const pickPublicFields = (body: Values) => pick(body, PUBLIC_FIELDS)
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
