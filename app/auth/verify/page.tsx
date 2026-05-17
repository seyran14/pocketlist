import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { OTPForm } from "@/components/auth/OTPForm"

export default async function VerifyPage() {
  const jar = await cookies()
  const email = jar.get("pending_auth_email")?.value

  if (!email) redirect("/login")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">PocketList</Link>
          <p className="text-muted-foreground text-sm mt-1">Check your email</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-5">
          <OTPForm email={email} />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn&apos;t receive it? Check spam or{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            try again
          </Link>
        </p>
      </div>
    </div>
  )
}
