import * as Sentry from "@sentry/nextjs"

type Level = "info" | "warn" | "error"
type Ctx = Record<string, unknown>

function maskEmail(email: string): string {
  const at = email.indexOf("@")
  if (at < 2) return "***"
  return `${email.slice(0, 2)}***${email.slice(at)}`
}

function emit(level: Level, event: string, ctx?: Ctx) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...ctx })
  // warn and info both go to stdout so Telegram monitor only fires on real errors
  if (level === "error") {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info(event: string, ctx?: Ctx) {
    emit("info", event, ctx)
  },

  warn(event: string, ctx?: Ctx) {
    emit("warn", event, ctx)
    Sentry.addBreadcrumb({ level: "warning", message: event, data: ctx })
  },

  error(event: string, error?: unknown, ctx?: Ctx) {
    const extra: Ctx = { ...ctx }
    if (error instanceof Error) {
      extra.errorMessage = error.message
      extra.errorName = error.name
    } else if (error !== undefined) {
      extra.error = String(error)
    }
    emit("error", event, extra)
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: ctx })
    } else if (error !== undefined) {
      Sentry.captureMessage(event, { level: "error", extra: { error, ...ctx } })
    }
  },

  setUser(id: string, email?: string) {
    Sentry.setUser({ id, email })
  },

  maskEmail,
}
