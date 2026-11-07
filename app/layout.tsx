import { SiteFooter } from "@/components/SiteFooter"
import type { Metadata } from "next"
import { Onest } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { I18nProvider } from "@/components/I18nProvider"
import { PostHogProvider } from "@/components/PostHogProvider"
import { MotionProvider } from "@/components/MotionProvider"
import { getLocale } from "@/lib/i18n/server"
import "./globals.css"

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${onest.variable} h-full antialiased`} suppressHydrationWarning>
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
