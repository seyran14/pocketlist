"use client"

import { Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/lib/i18n"
import { useLocale, useT } from "@/components/I18nProvider"
import { cn } from "@/lib/utils"

const YEAR_SECONDS = 60 * 60 * 24 * 365

export function LanguageSwitcher({ row = false }: { row?: boolean }) {
  const locale = useLocale()
  const t = useT()

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`
    // A full reload, because the language also sets the page direction on <html>.
    window.location.reload()
  }

  return (
    <Select value={locale} onValueChange={(v) => v && v !== locale && change(v as Locale)}>
      <SelectTrigger aria-label={t("Language")} className={cn("h-8 gap-1.5 border-0 bg-transparent px-2 text-sm text-muted-foreground shadow-none", row && "w-full gap-2 px-2.5 text-foreground hover:bg-muted")}>
        <Globe size={row ? 16 : 15} />
        <span className={cn(row ? "me-auto" : "uppercase")}>{row ? LOCALE_NAMES[locale] : locale}</span>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((code) => (
          <SelectItem key={code} value={code}>{LOCALE_NAMES[code]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
