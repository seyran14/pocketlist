"use client"

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
  return (
    <div className="ph-no-capture rounded-xl border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Verify your identity</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          We use these only to confirm you own the property. They&apos;re stored encrypted, buyers never see them, and
          you upload them once for all your listings.
        </p>
      </div>
      <DocumentUploader
        kind="PASSPORT"
        label="Passport"
        hint="Photo or PDF of the page with your photo"
        current={value.passport}
        showError={showError}
        onUploaded={(doc) => onChange({ ...value, passport: doc })}
        onUploadingChange={onUploadingChange}
      />
      <DocumentUploader
        kind="EMIRATES_ID"
        label="Emirates ID (optional)"
        hint="Only if you have one"
        current={value.emiratesId}
        onUploaded={(doc) => onChange({ ...value, emiratesId: doc })}
        onUploadingChange={onUploadingChange}
      />
      {showError && !value.passport && (
        <p role="alert" className="text-xs text-destructive">Upload your passport to publish.</p>
      )}
    </div>
  )
}
