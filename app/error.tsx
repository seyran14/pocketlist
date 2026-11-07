"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/I18nProvider"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const t = useT()
  // Sentry reports the error itself; the digest in the console links a visitor's report to the server log.
  useEffect(() => console.error(error.digest ?? error), [error])
  return (
    <div className="flex-1 bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold">{t("Something went wrong")}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {t("An unexpected error occurred. Please try again.")}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="default" onClick={() => unstable_retry()}>
            {t("Try again")}
          </Button>
          <Link href="/">
            <Button variant="outline">{t("Go home")}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
