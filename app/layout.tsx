import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { PostHogProvider } from "@/components/PostHogProvider"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketlist.ae"),
  title: "PocketList — Dubai Real Estate",
  description: "Browse and post Dubai property listings. Agents paste raw messages, AI parses them instantly.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans">
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
