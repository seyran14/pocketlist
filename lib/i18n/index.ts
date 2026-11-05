import { ar } from "@/lib/i18n/ar"
import { ru } from "@/lib/i18n/ru"

export const LOCALES = ["en", "ru", "ar"] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", ru: "Русский", ar: "العربية" }
export const LOCALE_COOKIE = "lang"

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = { ru, ar }

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

export type Translate = (text: string, vars?: Record<string, string | number>) => string

// The English text is the key, so anything untranslated still reads correctly.
export function translator(locale: Locale): Translate {
  const dictionary = DICTIONARIES[locale]
  return (text, vars) => {
    const template = dictionary?.[text] ?? text
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (match, name) => String(vars[name] ?? match))
  }
}
