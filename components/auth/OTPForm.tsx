"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function OTPForm({ email }: { email: string }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
    setCode(val)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.")
      return
    }
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({ token: code, email, callbackUrl: "/dashboard" })
      const res = await fetch(`/api/auth/callback/resend?${params}`, {
        credentials: "include",
      })

      // If final URL has an error or is still on auth pages — wrong code
      if (res.url.includes("error=") || res.url.includes("/login") || res.url.includes("/auth/")) {
        setError("Wrong code. Please try again.")
        setCode("")
        setLoading(false)
        return
      }

      // Success — session cookie is set, navigate to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Code sent to</p>
        <p className="text-sm font-medium">{email}</p>
      </div>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={handleChange}
        autoFocus
        placeholder="000000"
        className="w-full text-center text-3xl font-mono tracking-[0.4em] h-16 rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground/30"
      />

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={code.length !== 6 || loading}
      >
        {loading ? "Verifying…" : "Verify →"}
      </Button>
    </form>
  )
}
