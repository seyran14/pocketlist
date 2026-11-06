import { getT } from "@/lib/i18n/server"
import Link from "next/link"
import { RegisterForm } from "./RegisterForm"
import { DotMatrix } from "@/components/DotMatrix"

export default async function RegisterPage() {
  const t = await getT()
  return (
    <div className="relative flex-1 bg-background flex items-center justify-center p-4">
      <DotMatrix />
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">{t("Create your account")}</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
