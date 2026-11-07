"use client"

import { useT } from "@/components/I18nProvider"
import { SUPPORT_EMAIL } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LEGAL_UPDATED, PRIVACY, TERMS } from "@/lib/legal"

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
      <div className="scrim absolute inset-0" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border bg-card shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="font-semibold text-base">{t("Terms & Privacy Policy")}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-muted-foreground space-y-5 leading-relaxed">

          <p className="text-xs text-muted-foreground/70">{t(LEGAL_UPDATED)}</p>

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">{t("Terms of Service")}</h3>
            {TERMS.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="font-medium text-foreground">{t(section.title)}</p>
                <p>{t(section.text)}</p>
              </div>
            ))}
          </section>

          <div className="border-t" />

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">{t("Privacy Policy")}</h3>
            {PRIVACY.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="font-medium text-foreground">{t(section.title)}</p>
                <p>{t(section.text, { email: SUPPORT_EMAIL })}</p>
              </div>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t("Close")}
          </Button>
        </div>
      </div>
    </div>
  )
}
