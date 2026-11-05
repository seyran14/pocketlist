import { cookies } from "next/headers"
import { LOCALE_COOKIE, isLocale, translator, type Locale } from "@/lib/i18n"

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : "en"
}

export async function getT() {
  return translator(await getLocale())
}
