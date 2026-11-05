"use client"

import { useT } from "@/components/I18nProvider"
import { SUPPORT_EMAIL } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect } from "react"

export function TermsModal({ onClose }: { onClose: () => void }) {
  const t = useT()
  // close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="font-semibold text-base">{t("Terms & Privacy Policy")}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-muted-foreground space-y-5 leading-relaxed">

          <p className="text-xs text-muted-foreground/70">{t("Last updated: November 2026")}</p>

          {/* Terms of Service */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">{t("Terms of Service")}</h3>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("1. About PocketList")}</p>
              <p>{t("PocketList is an online marketplace for Dubai real estate listings. We connect property owners with prospective buyers. PocketList is not a licensed real estate broker and does not participate in any transactions.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("2. Eligibility")}</p>
              <p>{t("You must be at least 18 years old to use PocketList. By registering you confirm you have the legal capacity to enter into these terms.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("3. Owner Responsibilities")}</p>
              <p>{t("Owners are solely responsible for the accuracy of their listings. All property details, photos, prices, and availability must be truthful and up to date, and you must have the right to publish every photo you upload. To list a property you must provide your title deed and passport, and may provide your Emirates ID. Listings are published only after we review them. Misrepresentation may result in account suspension.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("4. Buyer Responsibilities")}</p>
              <p>{t("Buyers are responsible for conducting their own due diligence before entering into any property transaction. PocketList does not verify listing accuracy and is not liable for any losses arising from transactions.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("5. Prohibited Use")}</p>
              <p>{t("You may not post false, misleading, or duplicate listings; spam other users; attempt to circumvent the platform; or use PocketList for any unlawful purpose.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("6. Account Termination")}</p>
              <p>{t("We reserve the right to suspend or terminate any account that violates these terms, without notice.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("7. Limitation of Liability")}</p>
              <p>{t("PocketList is provided \"as is\". We are not liable for any direct, indirect, or incidental damages arising from your use of the platform or any transactions between users.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("8. Changes to Terms")}</p>
              <p>{t("We may update these terms at any time. Continued use of PocketList after changes constitutes acceptance of the updated terms.")}</p>
            </div>
          </section>

          <div className="border-t" />

          {/* Privacy Policy */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">{t("Privacy Policy")}</h3>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("1. Data We Collect")}</p>
              <p>{t("We collect your email address and name when you register, listing information and photos you submit, your title deed, passport and, if provided, Emirates ID, and usage data (pages visited, clicks, session behaviour) to improve the platform. Identity and ownership documents are stored encrypted, used only to verify that you own the property, never shown to other users, and deleted when you delete the listing or your account.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("2. Analytics & Session Recording")}</p>
              <p>{t("We use PostHog to collect anonymous analytics including page views and user interactions. This may include session recordings — visual replays of how you navigate the site. All form inputs (passwords, emails) are masked and never recorded. No cookies are used for tracking.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("3. How We Use Your Data")}</p>
              <p>{t("Your data is used solely to operate and improve PocketList — to send OTP login codes, display your listings, and understand how the platform is used. We do not sell your data to third parties.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("4. Data Storage")}</p>
              <p>{t("Your account data is stored on secure servers in the EU/US. Analytics data is processed by PostHog on EU-based servers.")}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("5. Your Rights")}</p>
              <p>{t("You may request deletion of your account and associated data at any time by contacting us at {email}.", { email: SUPPORT_EMAIL })}</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">{t("6. Contact")}</p>
              <p>{t("For any privacy-related questions, please email {email}.", { email: SUPPORT_EMAIL })}</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-foreground text-background text-sm font-medium py-2.5 hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
