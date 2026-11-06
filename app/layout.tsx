import { SiteFooter } from "@/components/SiteFooter"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { I18nProvider } from "@/components/I18nProvider"
import { PostHogProvider } from "@/components/PostHogProvider"
import { getLocale } from "@/lib/i18n/server"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketlist.ae"),
  title: "PocketList — Dubai Real Estate",
  description: "Browse Dubai property listed directly by owners. Post your own home with photos in minutes.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-background font-sans">
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider locale={locale}>
              {children}
              <SiteFooter />
              <Toaster />
            </I18nProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
