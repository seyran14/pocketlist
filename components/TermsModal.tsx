"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

export function TermsModal({ onClose }: { onClose: () => void }) {
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
          <h2 className="font-semibold text-base">Terms & Privacy Policy</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-muted-foreground space-y-5 leading-relaxed">

          <p className="text-xs text-muted-foreground/70">Last updated: May 2026</p>

          {/* Terms of Service */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">Terms of Service</h3>

            <div className="space-y-1">
              <p className="font-medium text-foreground">1. About PocketList</p>
              <p>PocketList is an online marketplace for Dubai real estate listings. We connect property sellers and agents with prospective buyers. PocketList is not a licensed real estate broker and does not participate in any transactions.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">2. Eligibility</p>
              <p>You must be at least 18 years old to use PocketList. By registering you confirm you have the legal capacity to enter into these terms.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">3. Agent Responsibilities</p>
              <p>Agents are solely responsible for the accuracy of their listings. All property details, prices, and availability must be truthful and up to date. Misrepresentation may result in account suspension.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">4. Buyer Responsibilities</p>
              <p>Buyers are responsible for conducting their own due diligence before entering into any property transaction. PocketList does not verify listing accuracy and is not liable for any losses arising from transactions.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">5. Prohibited Use</p>
              <p>You may not post false, misleading, or duplicate listings; spam other users; attempt to circumvent the platform; or use PocketList for any unlawful purpose.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">6. Account Termination</p>
              <p>We reserve the right to suspend or terminate any account that violates these terms, without notice.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">7. Limitation of Liability</p>
              <p>PocketList is provided &quot;as is&quot;. We are not liable for any direct, indirect, or incidental damages arising from your use of the platform or any transactions between users.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">8. Changes to Terms</p>
              <p>We may update these terms at any time. Continued use of PocketList after changes constitutes acceptance of the updated terms.</p>
            </div>
          </section>

          <div className="border-t" />

          {/* Privacy Policy */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">Privacy Policy</h3>

            <div className="space-y-1">
              <p className="font-medium text-foreground">1. Data We Collect</p>
              <p>We collect your email address and name when you register, listing information you submit, and usage data (pages visited, clicks, session behaviour) to improve the platform.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">2. Analytics & Session Recording</p>
              <p>We use PostHog to collect anonymous analytics including page views and user interactions. This may include session recordings — visual replays of how you navigate the site. All form inputs (passwords, emails) are masked and never recorded. No cookies are used for tracking.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">3. How We Use Your Data</p>
              <p>Your data is used solely to operate and improve PocketList — to send OTP login codes, display your listings, and understand how the platform is used. We do not sell your data to third parties.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">4. Data Storage</p>
              <p>Your account data is stored on secure servers in the EU/US. Analytics data is processed by PostHog on EU-based servers.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">5. Your Rights</p>
              <p>You may request deletion of your account and associated data at any time by contacting us at <span className="text-foreground">support@pocketlist.ae</span>.</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">6. Contact</p>
              <p>For any privacy-related questions, please email <span className="text-foreground">support@pocketlist.ae</span>.</p>
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
