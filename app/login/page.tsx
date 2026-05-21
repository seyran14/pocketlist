import { signIn } from "@/lib/auth"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Server configuration error. Please try again later.",
  AccessDenied: "Access denied.",
  Verification: "The sign-in link has expired or already been used. Request a new one.",
  Default: "Something went wrong. Please try again.",
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">PocketList</Link>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        <StatusBanner searchParams={searchParams} />

        <div className="rounded-xl border bg-card p-6 space-y-4">
          {/* Magic link */}
          <form
            action={async (formData: FormData) => {
              "use server"
              const email = formData.get("email") as string
              const jar = await cookies()
              jar.set("pending_auth_email", email, { httpOnly: true, path: "/", maxAge: 900 })
              await signIn("resend", { email, redirectTo: "/dashboard" })
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              Send code →
            </Button>
          </form>

        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          New here?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Create an account
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
  const { error } = await searchParams
  if (!error) return null
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-4">
      {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
    </div>
  )
}
