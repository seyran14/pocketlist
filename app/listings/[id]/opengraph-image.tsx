import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true, projectName: true, location: true, price: true, priceLabel: true, bedrooms: true, propertyType: true, isDistress: true },
  })

  if (!listing) return new ImageResponse(<div>Not found</div>, { ...size })

  const title = listing.title || listing.projectName
  const price = listing.priceLabel ?? `AED ${listing.price.toLocaleString("en-AE")}`
  const beds = listing.bedrooms === "Studio" ? "Studio" : `${listing.bedrooms} BR`
  const type = listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111827 100%)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "60px 72px", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#ffffff", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>
            PocketList
          </span>
          {listing.isDistress && (
            <span style={{ background: "#ef4444", color: "#fff", fontSize: "14px", fontWeight: "600", padding: "4px 12px", borderRadius: "999px" }}>
              Distress Deal
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#ffffff", fontSize: "52px", fontWeight: "800", letterSpacing: "-1px", lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "26px", fontWeight: "400" }}>
            {listing.location}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#ffffff", fontSize: "42px", fontWeight: "700", letterSpacing: "-0.5px" }}>
            {price}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {[beds, type].map((tag) => (
              <span key={tag} style={{ background: "rgba(255,255,255,0.1)", color: "#e5e7eb", fontSize: "18px", padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
