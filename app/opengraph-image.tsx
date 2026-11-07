import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "PocketList: rent a home in Dubai from its owner"

// Brand palette, kept in step with the tokens in app/globals.css.
const bg = "#faf8f5"
const fg = "#221e1a"
const muted = "#6c645b"
const brand = "#2d5a46"

// The shared preview for the home page and any page without its own image.
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg, padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700, color: fg, letterSpacing: -1 }}>
            <svg width={52} height={52} viewBox="0 0 26 26">
              <path d="M5 23V12a8 8 0 0 1 16 0v11z" fill="none" stroke={brand} strokeWidth="2.4" strokeLinejoin="round" />
              <path d="M10 23v-6.5a3 3 0 0 1 6 0V23z" fill={brand} />
            </svg>
            PocketList
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontSize: 72, fontWeight: 700, color: fg, letterSpacing: -2.5, lineHeight: 1.05, maxWidth: 820 }}>
              Rent a home in Dubai from its owner
            </span>
            <span style={{ fontSize: 30, color: muted, maxWidth: 780, lineHeight: 1.35 }}>
              Every title deed is checked before a listing goes live.
            </span>
          </div>
          <span style={{ fontSize: 24, color: brand, fontWeight: 600 }}>pocketlist.ae</span>
        </div>
        {/* The door arch, drawn large on the right, as on the sign-in page. */}
        <div style={{ display: "flex", alignItems: "flex-end", marginBottom: -72 }}>
          <div style={{ display: "flex", width: 260, height: 440, borderTopLeftRadius: 130, borderTopRightRadius: 130, border: `3px solid ${brand}`, borderBottom: "none", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 120, height: 200, borderTopLeftRadius: 60, borderTopRightRadius: 60, background: brand }} />
          </div>
        </div>
      </div>
    ),
    size
  )
}
