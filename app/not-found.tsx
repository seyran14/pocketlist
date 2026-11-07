import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getT } from "@/lib/i18n/server"

export default async function NotFound() {
  const t = await getT()
  return (
    <div className="flex-1 bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm text-center">
        <p className="text-7xl font-bold text-muted-foreground/20">404</p>
        <h1 className="text-xl font-semibold mt-4">{t("Page not found")}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {t("This listing may have been removed or the link is broken.")}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="default">{t("Browse listings")}</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">{t("Dashboard")}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
