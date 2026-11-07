import { pageMetadata } from "@/lib/i18n/meta"
import { getT } from "@/lib/i18n/server"
import { SUPPORT_EMAIL } from "@/lib/utils"
import { SupportButton } from "@/components/SupportButton"
import { TextPage, TextSection } from "@/components/LegalPage"

export function generateMetadata() {
  return pageMetadata("Contact", "Write to the PocketList team about a listing, your account or a contract.")
}

export default async function ContactPage() {
  const t = await getT()
  return (
    <TextPage
      title={t("Contact")}
      intro={<p>{t("Write to us about a listing, your account or a contract. A person on our team reads every message.")}</p>}
    >
      <TextSection title={t("Email")}>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-lg font-medium text-foreground underline underline-offset-4">{SUPPORT_EMAIL}</a>
        </p>
      </TextSection>
      <TextSection title={t("Or write here")}>
        <p>{t("The form sends your message to the same inbox, and we reply to the email you leave.")}</p>
        <SupportButton page />
      </TextSection>
    </TextPage>
  )
}
