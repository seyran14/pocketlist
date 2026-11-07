"use client"

import { useT } from "@/components/I18nProvider"

// First stop for keyboard users: jumps past the header to the page's <main id="main">.
export function SkipLink() {
  const t = useT()
  return (
    <a
      href="#main"
      className="sr-only rounded-lg bg-background px-4 py-2 text-sm font-medium shadow-pop focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100]"
    >
      {t("Skip to content")}
    </a>
  )
}
