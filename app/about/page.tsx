import { pageMetadata } from "@/lib/i18n/meta"
import Link from "next/link"
import { getT } from "@/lib/i18n/server"
import { TextPage, TextSection } from "@/components/LegalPage"

export function generateMetadata() {
  return pageMetadata("About", "PocketList is where Dubai homeowners rent out their homes themselves, with each title deed checked before a listing goes live.")
}

export default async function AboutPage() {
  const t = await getT()
  return (
    <TextPage
      title={t("About PocketList")}
      intro={<p>{t("PocketList is where people rent homes in Dubai directly from their owners. Owners post their own listings, and tenants contact them without an agent in between.")}</p>}
    >
      <TextSection title={t("How listings are checked")}>
        <p>{t("Before a listing goes live, a person on our team compares the owner's title deed and passport with the details they entered. A listing stays up for 30 days, and the owner can renew it.")}</p>
      </TextSection>
      <TextSection title={t("From the first message to Ejari")}>
        <p>{t("Owners and tenants agree the terms between themselves. The owner then prepares the tenancy contract here, both sides sign it on screen, and the contract takes effect once it is registered on Ejari.")}</p>
      </TextSection>
      <TextSection title={t("What we are not")}>
        <p>{t("PocketList is not a licensed real estate broker and takes no part in the deals made through it.")}</p>
      </TextSection>
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/guide" className="underline underline-offset-4">{t("How it works")}</Link>
        <Link href="/contact" className="underline underline-offset-4">{t("Contact")}</Link>
      </p>
    </TextPage>
  )
}
