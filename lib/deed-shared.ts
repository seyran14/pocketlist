// Pure so the form can warn the owner with the same rules the reviewer sees.

export type DeedFields = {
  isDldDocument: boolean
  isPreTitle: boolean
  propertyNumber: string | null
  buildingName: string | null
  community: string | null
  propertyType: string | null
  parkings: string | null
  areaSqft: number | null
  areaSqm: number | null
  ownerNames: string[]
  mortgageStatus: string | null
  issueDate: string | null
  deedNumber: string | null
  purchasePrice: number | null
}

export type DeedClaim = {
  propertyNumber?: string | null
  projectName?: string | null
  location?: string | null
  propertyType?: string | null
  areaSqft?: number | null
  areaSqm?: number | null
  parkingSpots?: number | null
  ownerName?: string | null
  poaAvailable?: boolean | null
}

export type DeedCheck = {
  key: string
  label: string
  claimed: string
  found: string
  // "check" means a person has to decide: names legitimately differ, or nothing could be read.
  result: "match" | "mismatch" | "check"
}

const AREA_TOLERANCE = 0.02
const SQM_PER_SQFT = 0.092903

// DLD registers penthouses and duplexes as flats.
const DEED_TYPES: Record<string, string[]> = {
  APARTMENT: ["flat", "apartment", "unit"],
  PENTHOUSE: ["flat", "apartment", "unit", "penthouse"],
  DUPLEX: ["flat", "apartment", "unit", "duplex"],
  TOWNHOUSE: ["townhouse", "town house", "villa"],
  VILLA: ["villa"],
}

function asciiLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/[^\x20-\x7E]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

function labelled(lines: string[], label: RegExp) {
  for (const [i, line] of lines.entries()) {
    const match = line.match(label)
    if (!match) continue
    const value = line.slice(match[0].length).replace(/[\s:]+$/, "").trim()
    // In Word exports labels share a line ("Property No: Floor No:"), which isn't a value.
    if (value && !value.includes(":")) return { value, next: lines[i + 1] ?? "" }
  }
  return null
}

function namesAfter(text: string, heading: RegExp) {
  const start = text.search(heading)
  if (start < 0) return []
  const section = text.slice(start).split(/Purchased from|Approved Signature/i)[0]
  const names = [...section.matchAll(/\(\d{4,}\)\s+([A-Z][A-Z .'-]*[A-Z])/g)].map((m) => m[1].trim())
  return [...new Set(names)]
}

export function parseDeed(text: string): DeedFields {
  const lines = asciiLines(text)
  const flat = lines.join("\n")
  const number = (label: RegExp) => {
    const parsed = parseFloat(labelled(lines, label)?.value ?? "")
    return Number.isFinite(parsed) ? parsed : null
  }

  // A pre-title deed lists the developer under Owners; the real owner is the buyer.
  const buyers = namesAfter(flat, /Buyers and their shares/i)
  const owners = namesAfter(flat, /Owners and their shares/i)

  const building = labelled(lines, /^Building Name\s*:/i)
  const wrapped = building?.next.match(/^(\d+)( \d+)?$/)?.[1]

  return {
    isDldDocument: /DUBAI LAND DEPARTMENT/i.test(flat),
    isPreTitle: buyers.length > 0,
    propertyNumber: labelled(lines, /^Property No\s*:/i)?.value.split(" ")[0] ?? null,
    buildingName: building ? [building.value, wrapped].filter(Boolean).join(" ") : null,
    community: labelled(lines, /^Community\s*:/i)?.value ?? null,
    propertyType: labelled(lines, /^Property Type\s*:/i)?.value ?? null,
    parkings: labelled(lines, /^Parkings?\s*:/i)?.value ?? null,
    areaSqft: number(/^Area Sq Feet\s*:/i),
    areaSqm: number(/^Area Sq Meter\s*:/i),
    ownerNames: buyers.length > 0 ? buyers : owners,
    mortgageStatus: labelled(lines, /^Mortgage Status\s*:/i)?.value ?? null,
    issueDate: flat.match(/\b\d{2}-\d{2}-\d{4}\b/)?.[0] ?? null,
    deedNumber: flat.match(/\b\d{3,}\/20\d{2}\b/)?.[0] ?? null,
    purchasePrice: Number(flat.match(/amount\s+(\d+)\s+Dirham/i)?.[1]) || null,
  }
}

function words(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean)
}

function containsAll(haystack: string, needle: string) {
  const available = new Set(words(haystack))
  const wanted = words(needle)
  return wanted.length > 0 && wanted.every((w) => available.has(w))
}

function hasToken(text: string, value: string) {
  const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i").test(text)
}

function namesMatch(claimed: string, deedName: string) {
  const claimedWords = words(claimed)
  const shared = words(deedName).filter((w) => claimedWords.includes(w))
  return shared.length >= Math.min(2, claimedWords.length) && shared.length > 0
}

function closeTo(a: number, b: number) {
  return Math.abs(a - b) <= b * AREA_TOLERANCE
}

function checkArea(claim: DeedClaim, fields: DeedFields, text: string): DeedCheck {
  const base = { key: "area", label: "Area" }
  const sqft = claim.areaSqft ?? (claim.areaSqm ? claim.areaSqm / SQM_PER_SQFT : null)
  if (!sqft) return { ...base, claimed: "—", found: fields.areaSqft ? `${fields.areaSqft} sqft` : "—", result: "check" }

  const claimed = `${Math.round(sqft)} sqft`
  const deedSqft = fields.areaSqft ?? (fields.areaSqm ? fields.areaSqm / SQM_PER_SQFT : null)
  if (deedSqft) {
    return { ...base, claimed, found: `${deedSqft} sqft`, result: closeTo(sqft, deedSqft) ? "match" : "mismatch" }
  }

  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => parseFloat(m[0]))
  const inText = numbers.some((n) => closeTo(sqft, n) || closeTo(sqft * SQM_PER_SQFT, n))
  return { ...base, claimed, found: inText ? "Found in the text" : "Not found", result: inText ? "match" : "mismatch" }
}

export function compareDeed(claim: DeedClaim, fields: DeedFields, text: string): DeedCheck[] {
  if (!text.trim()) {
    return [{
      key: "unreadable",
      label: "Document",
      claimed: "—",
      found: "No text to read, compare by hand",
      result: "check",
    }]
  }

  const checks: DeedCheck[] = []

  const number = claim.propertyNumber?.trim() ?? ""
  if (fields.propertyNumber) {
    checks.push({
      key: "propertyNumber", label: "Property number", claimed: number || "—", found: fields.propertyNumber,
      result: number.toLowerCase() === fields.propertyNumber.toLowerCase() ? "match" : "mismatch",
    })
  } else {
    const inText = !!number && hasToken(text, number)
    checks.push({
      key: "propertyNumber", label: "Property number", claimed: number || "—",
      found: inText ? "Found in the text" : "Not found", result: inText ? "match" : "mismatch",
    })
  }

  const building = claim.projectName?.trim() ?? ""
  const buildingFound = fields.buildingName
    ? containsAll(fields.buildingName, building) || containsAll(building, fields.buildingName)
    : containsAll(text, building)
  checks.push({
    key: "building", label: "Building", claimed: building || "—",
    found: fields.buildingName ?? (buildingFound ? "Found in the text" : "Not found"),
    result: buildingFound ? "match" : "mismatch",
  })

  // Deeds use the DLD community ("Al Khairan First"), owners the marketing name
  // ("Dubai Creek Harbour"), so a difference here isn't evidence of anything.
  const location = claim.location?.trim() ?? ""
  checks.push({
    key: "location", label: "Location", claimed: location || "—", found: fields.community ?? "—",
    result: fields.community && (containsAll(fields.community, location) || containsAll(location, fields.community))
      ? "match"
      : "check",
  })

  if (claim.propertyType) {
    const accepted = DEED_TYPES[claim.propertyType] ?? []
    const found = fields.propertyType?.toLowerCase()
    checks.push({
      key: "propertyType", label: "Property type", claimed: claim.propertyType, found: fields.propertyType ?? "—",
      result: !found ? "check" : accepted.some((t) => found.includes(t)) ? "match" : "mismatch",
    })
  }

  checks.push(checkArea(claim, fields, text))

  if (claim.parkingSpots !== undefined && claim.parkingSpots !== null) {
    const count = fields.parkings ? fields.parkings.split(/[,;]/).filter((p) => p.trim()).length : null
    checks.push({
      key: "parking", label: "Parking", claimed: String(claim.parkingSpots),
      found: fields.parkings ? `${count} (${fields.parkings})` : "—",
      result: count === null ? "check" : count === claim.parkingSpots ? "match" : "mismatch",
    })
  }

  if (claim.ownerName !== undefined) {
    const name = claim.ownerName?.trim() ?? ""
    const matched = fields.ownerNames.some((n) => namesMatch(name, n))
    checks.push({
      key: "owner", label: "Owner name", claimed: name || "—", found: fields.ownerNames.join(", ") || "—",
      // Someone holding a power of attorney legitimately isn't the name on the deed.
      result: matched ? "match" : fields.ownerNames.length === 0 || claim.poaAvailable ? "check" : "mismatch",
    })
  }

  checks.push({
    key: "mortgage", label: "Mortgage", claimed: "—", found: fields.mortgageStatus ?? "—",
    result: /^not mortgaged$/i.test(fields.mortgageStatus ?? "") ? "match" : "check",
  })

  checks.push({
    key: "issuer", label: "Issuer", claimed: "Dubai Land Department",
    found: fields.isDldDocument ? "Dubai Land Department" : "Not found",
    result: fields.isDldDocument ? "match" : "check",
  })

  return checks
}
