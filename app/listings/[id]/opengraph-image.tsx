import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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
  const beds = listing.bedrooms === "Studio" ? "Studio" : `${listing.bedrooms} BR`
  const type = listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()
  const area = listing.areaSqft
    ? `${listing.areaSqft.toLocaleString()} sqft`
    : listing.areaSqm
    ? `${listing.areaSqm.toLocaleString()} sqm`
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#080808",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow — top right */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Ambient glow — bottom left */}
        <div
          style={{
            position: "absolute",
            left: -80,
            bottom: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Accent line top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #f59e0b 0%, #d97706 60%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Main layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 72px 56px",
            height: "100%",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Logo mark */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#000", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>P</span>
              </div>
              <span style={{ color: "#ffffff", fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>
                PocketList
              </span>
            </div>

            {listing.isDistress && (
              <div
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#f87171",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "6px 18px",
                  borderRadius: 999,
                  display: "flex",
                }}
              >
                Distress Deal
              </div>
            )}
          </div>

          {/* Title + location */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center", paddingTop: 8 }}>
            <div
              style={{
                color: "#ffffff",
                fontSize: title.length > 40 ? 44 : title.length > 28 ? 52 : 58,
                fontWeight: 800,
                letterSpacing: -1.5,
                lineHeight: 1.05,
                maxWidth: 1000,
              }}
            >
              {title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
              <span style={{ color: "#9ca3af", fontSize: 24, letterSpacing: -0.3 }}>
                {listing.location}
              </span>
              {area && (
                <>
                  <span style={{ color: "#2e2e2e", fontSize: 22 }}>·</span>
                  <span style={{ color: "#6b7280", fontSize: 22 }}>{area}</span>
                </>
              )}
            </div>
          </div>

          {/* Footer row — price + tags */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#4b4b4b", fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Price
              </span>
              <span
                style={{
                  color: "#fbbf24",
                  fontSize: 46,
                  fontWeight: 800,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                {price}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {[beds, type].map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#d1d5db",
                    fontSize: 18,
                    fontWeight: 500,
                    padding: "10px 22px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                  }}
                >
                  {tag}
                </span>
              ))}
              <span
                style={{
                  color: "#3a3a3a",
                  fontSize: 16,
                  marginLeft: 8,
                  display: "flex",
                }}
              >
                pocketlist.ae
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
