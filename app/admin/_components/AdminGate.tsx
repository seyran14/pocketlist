import { verifyAdminPassword } from "../_actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function AdminGate({ error }: { error?: boolean }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Admin access</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Incorrect password
            </div>
          )}

          <form action={verifyAdminPassword} className="space-y-3">
            <Input
              type="password"
              name="password"
              placeholder="Password"
              autoFocus
              required
            />
            <Button type="submit" className="w-full">
              Continue →
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
