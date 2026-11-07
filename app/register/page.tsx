import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { RegisterForm } from "./RegisterForm"
import { ArchBackdrop } from "@/components/ArchBackdrop"
import { BrandMark } from "@/components/BrandLogo"
import { pageMetadata } from "@/lib/i18n/meta"

export function generateMetadata() {
  return pageMetadata("Create an account", "Create a tenant or owner account on PocketList.")
}

// "?as=owner" comes from "Post your home" and preselects the owner account.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const t = await getT()
  const { as } = await searchParams
  return (
    <div className="relative flex-1 bg-background flex items-center justify-center px-8 py-4 sm:p-4">
      <ArchBackdrop />
      <div className="card-animate relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.025em]">
            <BrandMark className="size-8" />
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">{t("Create your account")}</p>
        </div>

        <RegisterForm initialRole={as === "owner" ? "AGENT" : "BUYER"} />
      </div>
    </div>
  )
}
