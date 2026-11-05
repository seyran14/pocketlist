"use client"

import { Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/lib/i18n"
import { useLocale, useT } from "@/components/I18nProvider"

const YEAR_SECONDS = 60 * 60 * 24 * 365

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useT()

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`
    // A full reload, because the language also sets the page direction on <html>.
    window.location.reload()
  }

  return (
    <Select value={locale} onValueChange={(v) => v && v !== locale && change(v as Locale)}>
      <SelectTrigger aria-label={t("Language")} className="h-8 gap-1.5 border-0 bg-transparent px-2 text-sm text-muted-foreground shadow-none">
        <Globe size={15} />
        <span className="uppercase">{locale}</span>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((code) => (
          <SelectItem key={code} value={code}>{LOCALE_NAMES[code]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
