import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Site palette (oklch → hex equivalents)
const bg       = "#fafafa"   // --background light
const fg       = "#0f0f0f"   // --foreground light
const muted    = "#71717a"   // --muted-foreground
const border   = "#e5e7eb"   // --border light
const tagBg    = "#f4f4f5"   // --muted light
const tagFg    = "#3f3f46"   // slightly darker muted
const dim      = "#a1a1aa"   // very muted

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true, projectName: true, location: true,
      price: true, priceLabel: true,
      bedrooms: true, propertyType: true,
      areaSqft: true, areaSqm: true,
      isDistress: true,
    },
  })

  if (!listing) return new ImageResponse(<div>Not found</div>, { ...size })

  const title = listing.title || listing.projectName
  const price = listing.priceLabel ?? `AED ${listing.price.toLocaleString("en-AE")}`
  const beds  = listing.bedrooms === "Studio" ? "Studio" : `${listing.bedrooms} BR`
  const type  = listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()
  const area  = listing.areaSqft
    ? `${listing.areaSqft.toLocaleString()} sqft`
    : listing.areaSqm
    ? `${listing.areaSqm.toLocaleString()} sqm`
    : null

  const titleSize = title.length > 50 ? 44 : title.length > 35 ? 52 : title.length > 22 ? 60 : 68

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: bg,
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          padding: "56px 72px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: fg, letterSpacing: -0.3 }}>
            PocketList
          </span>

          {listing.isDistress && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: 6,
                display: "flex",
              }}
            >
              Distress Deal
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: border, marginBottom: 44, display: "flex" }} />

        {/* Title */}
        <div
          style={{
            color: fg,
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: -1.5,
            lineHeight: 1.08,
            marginBottom: 20,
            flex: 1,
          }}
        >
          {title}
        </div>

        {/* Location + details row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 44,
          }}
        >
          <span style={{ color: muted, fontSize: 22, letterSpacing: -0.2 }}>
            {listing.location}
          </span>
          {area && (
            <>
              <span style={{ color: border, fontSize: 18 }}>·</span>
              <span style={{ color: muted, fontSize: 22 }}>{area}</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: border, marginBottom: 36, display: "flex" }} />

        {/* Footer — price + tags */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              color: fg,
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            {price}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[beds, type].map((tag) => (
              <span
                key={tag}
                style={{
                  background: tagBg,
                  color: tagFg,
                  fontSize: 17,
                  fontWeight: 500,
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  display: "flex",
                }}
              >
                {tag}
              </span>
            ))}
            <span style={{ color: dim, fontSize: 15, marginLeft: 12, display: "flex" }}>
              pocketlist.ae
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  )
}
