import { pageMetadata } from "@/lib/i18n/meta"
import Link from "next/link"
import { getT } from "@/lib/i18n/server"
import { LEGAL_UPDATED, PRIVACY } from "@/lib/legal"
import { SUPPORT_EMAIL } from "@/lib/utils"
import { TextPage, TextSection } from "@/components/LegalPage"

export function generateMetadata() {
  return pageMetadata("Privacy Policy", "What PocketList collects, including title deeds and passports, how it is stored and how to have it deleted.")
}

export default async function PrivacyPage() {
  const t = await getT()
  return (
    <TextPage
      title={t("Privacy Policy")}
      intro={<p>{t(LEGAL_UPDATED)} · <Link href="/terms" className="underline underline-offset-4">{t("Terms of Service")}</Link></p>}
    >
      {PRIVACY.map((section) => (
        <TextSection key={section.title} title={t(section.title)}>
          <p>{t(section.text, { email: SUPPORT_EMAIL })}</p>
        </TextSection>
      ))}
    </TextPage>
  )
}
