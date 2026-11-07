import type { Metadata } from "next"
import { getT } from "@/lib/i18n/server"

// Page titles and descriptions follow the visitor's language like the rest of the page.
// The root layout adds " | PocketList" to every <title> through its template; Open Graph
// replaces the parent's object rather than merging, so it is spelled out in full here.
// The site-wide preview from app/opengraph-image.tsx, resolved against metadataBase.
const SITE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "PocketList" }

export async function pageMetadata(title: string, description?: string): Promise<Metadata> {
  const t = await getT()
  const translated = t(title)
  const about = description ? t(description) : undefined
  return {
    title: translated,
    ...(about ? { description: about } : {}),
    openGraph: { type: "website", siteName: "PocketList", title: `${translated} | PocketList`, ...(about ? { description: about } : {}), images: [SITE_IMAGE] },
    twitter: { card: "summary_large_image", title: `${translated} | PocketList`, ...(about ? { description: about } : {}), images: [SITE_IMAGE.url] },
  }
}
