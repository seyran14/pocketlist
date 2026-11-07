import type { Locale } from "@/lib/i18n"

type Forms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

// Counted nouns need the language's plural forms, which the key-per-phrase dictionaries can't express.
const NOUNS: Record<"home" | "space" | "bedroom" | "cheque", Record<Locale, Forms>> = {
  home: {
    en: { one: "{n} home", other: "{n} homes" },
    ru: { one: "{n} дом", few: "{n} дома", many: "{n} домов", other: "{n} дома" },
    ar: { zero: "لا توجد عقارات", one: "عقار واحد", two: "عقاران", few: "{n} عقارات", many: "{n} عقارًا", other: "{n} عقار" },
  },
  bedroom: {
    en: { one: "{n} bedroom", other: "{n} bedrooms" },
    ru: { one: "{n} спальня", few: "{n} спальни", many: "{n} спален", other: "{n} спальни" },
    ar: { one: "غرفة نوم واحدة", two: "غرفتا نوم", few: "{n} غرف نوم", many: "{n} غرفة نوم", other: "{n} غرفة نوم" },
  },
  cheque: {
    en: { one: "{n} cheque", other: "{n} cheques" },
    ru: { one: "{n} чек", few: "{n} чека", many: "{n} чеков", other: "{n} чека" },
    ar: { one: "شيك واحد", two: "شيكان", few: "{n} شيكات", many: "{n} شيكًا", other: "{n} شيك" },
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
