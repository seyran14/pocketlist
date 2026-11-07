import type { Locale } from "@/lib/i18n"

type Forms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

// Counted nouns need the language's plural forms, which the key-per-phrase dictionaries can't express.
const NOUNS: Record<"home" | "space", Record<Locale, Forms>> = {
  home: {
    en: { one: "{n} home", other: "{n} homes" },
    ru: { one: "{n} дом", few: "{n} дома", many: "{n} домов", other: "{n} дома" },
    ar: { zero: "لا توجد عقارات", one: "عقار واحد", two: "عقاران", few: "{n} عقارات", many: "{n} عقارًا", other: "{n} عقار" },
  },
  space: {
    en: { one: "{n} space", other: "{n} spaces" },
    ru: { one: "{n} место", few: "{n} места", many: "{n} мест", other: "{n} места" },
    ar: { one: "موقف واحد", two: "موقفان", few: "{n} مواقف", many: "{n} موقفًا", other: "{n} موقف" },
  },
}

export function countOf(noun: keyof typeof NOUNS, n: number, locale: Locale): string {
  const forms = NOUNS[noun][locale]
  const form = forms[new Intl.PluralRules(locale).select(n)] ?? forms.other
  return form.replace("{n}", n.toLocaleString("en-US"))
}
