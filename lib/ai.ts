import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a Dubai real estate listing parser. Extract all property listings from the raw text below. There may be 1 to 20 units in one message. Return ONLY a valid JSON array, no explanation, no markdown.

For each unit extract:
- listingType: "SALE" | "RENT" — "for rent", "rental", "per year", "/yr", "to let", "available for rent", "للإيجار" → "RENT"; everything else → "SALE"
- projectName (string)
- location (string) — area/district only
- propertyType: "APARTMENT" | "TOWNHOUSE" | "VILLA" | "PENTHOUSE" | "DUPLEX"
- bedrooms: "Studio" | "1" | "2" | "3" | "4" | "5+" | null
- bathrooms: string | null
- areaSqft: number | null — BUA (built-up area / living area). Labels: "BUA", "Built Up Area", "sqft", "area". (if only sqm given: sqft = sqm * 10.764; if both given use as-is)
- areaSqm: number | null — BUA in sqm. (if only sqft given: sqm = sqft / 10.764; if both given use as-is)
- plotSqft: number | null — plot / land size. Labels: "Plot", "Plot Size", "Land Area", "Plot Area". (convert sqm → sqft if needed: sqft = sqm * 10.764)
- plotSqm: number | null — plot size in sqm. (convert sqft → sqm if needed: sqm = sqft / 10.764)
- price: number | null (always as integer, no currency symbol)
- floor: "LOW" | "MIDDLE" | "HIGH" | null
- view: string | null
- furnished: "FURNISHED" | "UNFURNISHED" | "PARTIAL" | null
- handover: string | null (e.g. "Ready", "Q1 2026")
- isDistress: boolean
- originalPrice: number | null (OP price if distress deal)
- isRented: boolean
- rentAmount: number | null
- notes: string | null (anything else relevant)

Rules:
- "Ready to move", "Ready", "Handover: Ready" all → handover: "Ready"
- "1BR", "1 bedroom", "1 bed", "1BD" all → bedrooms: "1"
- Prices like "1.5M", "1.5m", "1,500,000", "1500000" all → 1500000
- "High floor", "high floor", "High Floor" → floor: "HIGH"
- If a field is not mentioned, return null for it
- Ignore client requirement messages (not listings)
- Return ONLY the JSON array, nothing else`

export type ParsedListing = {
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
}

export async function parseListingText(rawText: string): Promise<ParsedListing[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: rawText,
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  return JSON.parse(json) as ParsedListing[]
}
