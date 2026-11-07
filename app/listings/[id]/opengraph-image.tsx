import { ImageResponse } from "next/og"
import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { isPublicStatus } from "@/lib/utils"
import { readPhotoFile } from "@/lib/photos"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Brand palette, kept in step with the tokens in app/globals.css.
const bg       = "#faf8f5"   // --background
const fg       = "#221e1a"   // --foreground
const muted    = "#6c645b"   // --muted-foreground
const border   = "#e6dfd6"   // --border
const tagBg    = "#efeae3"   // --muted
const tagFg    = "#3d3730"   // between foreground and muted
const brand    = "#2d5a46"   // --primary

function Mark({ size: side, color }: { size: number; color: string }) {
  return (
    <svg width={side} height={side} viewBox="0 0 26 26">
      <path d="M5 23V12a8 8 0 0 1 16 0v11z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M10 23v-6.5a3 3 0 0 1 6 0V23z" fill={color} />
    </svg>
  )
}

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
}

// Satori can't decode WebP, so the cover goes in as JPEG.
async function coverDataUri(photoId: string | undefined) {
  if (!photoId) return null
  const file = await readPhotoFile(`${photoId}.webp`)
  if (!file) return null
  const jpeg = await sharp(file).resize(size.width, size.height, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true, projectName: true, location: true, status: true,
      price: true, priceLabel: true,
      bedrooms: true, propertyType: true,
      areaSqft: true, areaSqm: true,
      isDistress: true,
      photos: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
    },
  })

  if (!listing || !isPublicStatus(listing.status)) return new ImageResponse(<div>Not found</div>, { ...size })

  const title = listing.title || listing.projectName
  const price = listing.priceLabel ?? `AED ${listing.price.toLocaleString("en-AE")}`
  const beds  = listing.bedrooms === "Studio" ? "Studio" : `${listing.bedrooms} BR`
  const type  = listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()
  const area  = listing.areaSqft
    ? `${Math.round(listing.areaSqft).toLocaleString()} sqft`
    : listing.areaSqm
    ? `${Math.round(listing.areaSqm).toLocaleString()} sqm`
    : null

  const cover = await coverDataUri(listing.photos[0]?.id).catch(() => null)

  if (cover) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "sans-serif" }}>
          <img src={cover} alt="" width={size.width} height={size.height} style={{ position: "absolute", top: 0, left: 0 }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              padding: "96px 56px 40px",
              color: "#fff",
              backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.85))",
            }}
          >
            <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{price}</span>
            <span style={{ fontSize: 28, marginTop: 8 }}>{title}</span>
            <span style={{ fontSize: 20, marginTop: 12, opacity: 0.8 }}>
              {[beds, type, area, "pocketlist.ae"].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      ),
      { ...size, headers: CACHE_HEADERS }
    )
  }

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
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 700, color: fg, letterSpacing: -0.5 }}>
            <Mark size={32} color={brand} />
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
            <span style={{ color: muted, fontSize: 15, marginLeft: 12, display: "flex" }}>
              pocketlist.ae
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: CACHE_HEADERS,
    }
  )
}
