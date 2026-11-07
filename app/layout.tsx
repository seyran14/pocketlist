import { SiteFooter } from "@/components/SiteFooter"
import type { Metadata } from "next"
import { IBM_Plex_Sans_Arabic, Onest } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { I18nProvider } from "@/components/I18nProvider"
import { PostHogProvider } from "@/components/PostHogProvider"
import { MotionProvider } from "@/components/MotionProvider"
import { getLocale, getT } from "@/lib/i18n/server"
import "./globals.css"

// Neither face brings its own fallback: Onest sets Latin and Cyrillic, and only the glyphs it
// lacks (Arabic) fall through to Plex Arabic, then to the system font.
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  fallback: [],
  adjustFontFallback: false,
})

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  fallback: [],
  adjustFontFallback: false,
})

// Every page title reads "<page> | PocketList"; the description repeats the home page's promise.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  const description = t("Rent a home in Dubai directly from its owner. Owners post their own homes, and we check each title deed before a listing goes live.")
  return {
    metadataBase: new URL("https://pocketlist.ae"),
    title: { default: t("PocketList | Rent a home in Dubai from its owner"), template: "%s | PocketList" },
    description,
    openGraph: { type: "website", siteName: "PocketList", title: "PocketList", description, url: "/" },
    twitter: { card: "summary_large_image", title: "PocketList", description },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${onest.variable} ${plexArabic.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="relative flex min-h-dvh flex-col bg-background font-sans">
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider locale={locale}>
              <MotionProvider>
                {children}
                <SiteFooter />
                <Toaster />
              </MotionProvider>
            </I18nProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
