// Where to send someone after they sign in. Only paths on this site are allowed, so a crafted
// link can't bounce a fresh session to another domain.
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback
  }
  return value.slice(0, 300)
}
