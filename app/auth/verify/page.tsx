import { getT } from "@/lib/i18n/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { OTPForm } from "@/components/auth/OTPForm"
import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth"
import { BrandMark } from "@/components/BrandLogo"

export default async function VerifyPage() {
  const t = await getT()
  const jar = await cookies()
  const email = jar.get("pending_auth_email")?.value

  if (!email) redirect("/login")

  return (
    <div className="flex-1 bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.025em]">
            <BrandMark className="size-8" />
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">{t("Check your email")}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-5">
          <OTPForm email={email} />
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
          <p className="text-sm text-muted-foreground">{t("Wrong email address?")}</p>
          <form action={async () => {
            "use server"
            const jar = await cookies()
            jar.delete("pending_auth_email")
            redirect("/login")
          }}>
            <Button variant="ghost" size="sm" type="submit" className="text-sm h-8">
              {t("Change email")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
