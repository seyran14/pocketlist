"use client"

import { createContext, useContext, useMemo } from "react"
import { translator, type Locale } from "@/lib/i18n"

const LocaleContext = createContext<Locale>("en")

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useT() {
  const locale = useLocale()
  return useMemo(() => translator(locale), [locale])
}
