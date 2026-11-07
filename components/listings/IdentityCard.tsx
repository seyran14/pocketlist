"use client"

import { useT } from "@/components/I18nProvider"
import { DocumentUploader } from "@/components/listings/DocumentUploader"

export type IdentityDocuments = {
  passport: { fileName: string } | null
  emiratesId: { fileName: string } | null
}

type Props = {
  value: IdentityDocuments
  onChange: (value: IdentityDocuments) => void
  showError: boolean
  onUploadingChange: (uploading: boolean) => void
}

export function IdentityCard({ value, onChange, showError, onUploadingChange }: Props) {
  const t = useT()
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{t("Verify your identity")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("We use these only to confirm you own the property. They're stored encrypted, tenants never see them, and you upload them once for all your listings.")}
        </p>
      </div>
      <DocumentUploader
        kind="PASSPORT"
        label="Passport"
        hint={t("Photo or PDF of the page with your photo")}
        current={value.passport}
        showError={showError}
        onUploaded={(doc) => onChange({ ...value, passport: doc })}
        onUploadingChange={onUploadingChange}
      />
      <DocumentUploader
        kind="EMIRATES_ID"
        label="Emirates ID (optional)"
        hint={t("Only if you have one")}
        current={value.emiratesId}
        onUploaded={(doc) => onChange({ ...value, emiratesId: doc })}
        onUploadingChange={onUploadingChange}
      />
      {showError && !value.passport && (
        <p role="alert" className="text-xs text-destructive">{t("Upload your passport to publish.")}</p>
      )}
    </div>
  )
}
