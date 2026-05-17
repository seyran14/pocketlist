"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-animate w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="default" onClick={() => unstable_retry()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
