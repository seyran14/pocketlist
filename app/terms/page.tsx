import { pageMetadata } from "@/lib/i18n/meta"
import Link from "next/link"
import { getT } from "@/lib/i18n/server"
import { LEGAL_UPDATED, TERMS } from "@/lib/legal"
import { TextPage, TextSection } from "@/components/LegalPage"

export function generateMetadata() {
  return pageMetadata("Terms of Service", "The rules for listing a home on PocketList and contacting its owners.")
}

export default async function TermsPage() {
  const t = await getT()
  return (
    <TextPage
      title={t("Terms of Service")}
      intro={<p>{t(LEGAL_UPDATED)} · <Link href="/privacy" className="underline underline-offset-4">{t("Privacy Policy")}</Link></p>}
    >
      {TERMS.map((section) => (
        <TextSection key={section.title} title={t(section.title)}>
          <p>{t(section.text)}</p>
        </TextSection>
      ))}
    </TextPage>
  )
}
