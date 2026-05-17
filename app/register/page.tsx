import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAction } from "@/lib/actions/auth"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            PocketList
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Create your account</p>
        </div>

        <form action={registerAction} className="space-y-5">
          <div className="space-y-1.5">
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

          <div className="space-y-2">
            <Label>I am…</Label>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                id="role-buyer"
                value="BUYER"
                title="Looking to buy"
                description="Browse listings and contact agents"
                defaultChecked
              />
              <RoleCard
                id="role-agent"
                value="AGENT"
                title="Agent / Seller"
                description="Post listings and get contacted by buyers"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continue →
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function RoleCard({
  id,
  value,
  title,
  description,
  defaultChecked,
}: {
  id: string
  value: "BUYER" | "AGENT"
  title: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className="relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 transition-colors has-[:checked]:border-foreground has-[:checked]:bg-muted/30"
    >
      <input
        type="radio"
        id={id}
        name="role"
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span className="font-semibold text-sm mb-1">{title}</span>
      <span className="text-xs text-muted-foreground leading-snug">{description}</span>
    </label>
  )
}
