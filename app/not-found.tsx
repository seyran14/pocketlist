import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { pageMetadata } from "@/lib/i18n/meta"
import { getT } from "@/lib/i18n/server"

export function generateMetadata() {
  return pageMetadata("Page not found")
}

// Any unknown address lands here, not only removed listings, so the text stays general.
export default async function NotFound() {
  const [t, session] = await Promise.all([getT(), auth()])
  return (
    <>
      <Navbar />
      <main id="main" className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-7xl font-bold text-muted-foreground/20">404</p>
          <h1 className="mt-4 text-xl font-semibold">{t("Page not found")}</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            {t("This page doesn't exist or has been removed. Check the address, or browse the homes on PocketList.")}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/">
              <Button>{t("Browse listings")}</Button>
            </Link>
            {session?.user && (
              <Link href="/dashboard">
                <Button variant="outline">{t("Dashboard")}</Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
