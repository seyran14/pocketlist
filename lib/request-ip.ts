// The site sits behind Cloudflare, which puts the visitor's address in CF-Connecting-IP and
// overwrites any copy the client sent. X-Forwarded-For is client-controlled, so it is never used.
// The origin only accepts connections from Cloudflare, so the header can be trusted.
export function clientIp(headers: Headers): string {
  return headers.get("cf-connecting-ip")?.trim() || headers.get("x-real-ip")?.trim() || "unknown"
}
