"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
    if (!key) return

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,       // handled manually below for SPA routing
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,         // masks emails, passwords, etc. in recordings
      },
      persistence: "memory",         // no cookies — GDPR friendly
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <PageviewTracker />
      {children}
    </PHProvider>
  )
}

// Tracks page views on route change (Next.js App Router)
function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "")
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams])

  return null
}
