import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",") ?? [],
  devIndicators: false,
  async redirects() {
    return [
      { source: "/agents", destination: "/owners", permanent: true },
      { source: "/agents/:id", destination: "/owners/:id", permanent: true },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
})
