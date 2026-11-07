import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { RegisterForm } from "./RegisterForm"
import { ArchBackdrop } from "@/components/ArchBackdrop"
import { BrandMark } from "@/components/BrandLogo"

export default async function RegisterPage() {
  const t = await getT()
  return (
    <div className="relative flex-1 bg-background flex items-center justify-center p-4">
      <ArchBackdrop />
      <div className="card-animate relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.025em]">
            <BrandMark className="size-8" />
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">{t("Create your account")}</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
