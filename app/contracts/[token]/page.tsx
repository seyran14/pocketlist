import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { findContractByToken } from "@/lib/contracts"
import { TenantSignClient } from "./TenantSignClient"

export const metadata: Metadata = {
  title: "Tenancy contract | PocketList",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default async function ContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const contract = await findContractByToken(token)
  if (!contract) notFound()

  const expired = contract.status === "AWAITING_TENANT" && contract.linkExpiresAt < new Date()
  return (
    <main className="ph-no-capture mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Tenancy contract</h1>
      {expired ? (
        <p className="text-sm text-muted-foreground">This link has expired. Ask the owner to send a new contract.</p>
      ) : (
        <TenantSignClient
          token={token}
          email={contract.tenantEmail}
          initialName={contract.tenantName ?? ""}
          completed={contract.status === "COMPLETED"}
        />
      )}
    </main>
  )
}
