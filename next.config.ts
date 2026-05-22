import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.142"],
  devIndicators: false,
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  disableLogger: true,
})
