import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { checkRateLimit } from "@/lib/ratelimit"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">PocketList</Link>
          <p className="text-muted-foreground text-sm mt-1">Admin sign in</p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-4">
            {error === "rate_limited"
              ? "Too many attempts. Please wait 15 minutes."
              : "Incorrect email or password."}
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <form
            action={async (formData: FormData) => {
              "use server"
              const h = await headers()
              const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
              const { allowed } = checkRateLimit(`admin-login:${ip}`, 5, 15)
              if (!allowed) redirect("/admin/login?error=rate_limited")
              try {
                await signIn("admin-password", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirectTo: "/admin",
                })
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                if (msg.includes("NEXT_REDIRECT")) throw e
                redirect("/admin/login?error=1")
              }
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoFocus />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Sign in →
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
