import { getT } from "@/lib/i18n/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/actions/auth"
import { ArchBackdrop } from "@/components/ArchBackdrop"
import Link from "next/link"
import { BrandMark } from "@/components/BrandLogo"
import { pageMetadata } from "@/lib/i18n/meta"

export function generateMetadata() {
  return pageMetadata("Sign in", "Sign in to PocketList with a 6-digit code sent to your email.")
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Server configuration error. Please try again later.",
  AccessDenied: "Access denied.",
  Verification: "The sign-in link has expired or already been used. Request a new one.",
  not_registered: "No account found with this email. Please register first.",
  already_registered: "You already have an account. Sign in below.",
  rate_limited: "Too many attempts. Please wait 15 minutes and try again.",
  Default: "Something went wrong. Please try again.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const t = await getT()
  return (
    <div className="relative flex-1 bg-background flex items-center justify-center px-8 py-4 sm:p-4">
      <ArchBackdrop />
      <div className="card-animate relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.025em]">
            <BrandMark className="size-8" />
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">{t("We'll email you a 6-digit code to sign in.")}</p>
        </div>

        <StatusBanner searchParams={searchParams} />

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <form action={loginAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email address")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              {t("Send code")}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            {t("By continuing you agree to the")}{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">{t("Terms")}</Link>
            {" · "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">{t("Privacy")}</Link>
          </p>

        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("New here?")}{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            {t("Create an account")}
          </Link>
        </p>
      </div>
    </div>
  )
}

async function StatusBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const t = await getT()
  const { error } = await searchParams
  if (!error) return null
  const isInfo = error === "already_registered"
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm mb-4 ${isInfo ? "border-blue-300/50 bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
      {t(ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)}
    </div>
  )
}
