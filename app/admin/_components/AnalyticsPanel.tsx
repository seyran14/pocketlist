import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { EVENT_TYPES, type EventType } from "@/lib/events"

const DAY = 24 * 60 * 60 * 1000

const EVENT_LABELS: Record<EventType, string> = {
  contact_revealed: "Contacts shown",
  inquiry_sent: "Inquiries sent",
  support_message_sent: "Support messages",
}

type Traffic = { pageviews: number | null; visitors: number | null }

// Umami runs on this server under /stats. Its API needs a login token, so the panel signs in
// with the admin account from the environment; without it only our own counts are shown.
async function fetchUmamiTraffic(since: Date): Promise<Traffic> {
  const base = process.env.UMAMI_API_URL
  const websiteId = process.env.UMAMI_WEBSITE_ID
  const username = process.env.UMAMI_USERNAME
  const password = process.env.UMAMI_PASSWORD
  const empty = { pageviews: null, visitors: null }
  if (!base || !websiteId || !username || !password) return empty

  try {
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    })
    if (!login.ok) return empty
    const { token } = await login.json()

    const params = new URLSearchParams({ startAt: String(since.getTime()), endAt: String(Date.now()) })
    const res = await fetch(`${base}/api/websites/${websiteId}/stats?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return empty
    const data = await res.json()
    // Older Umami returns { value, prev } per metric, newer returns plain numbers.
    const read = (metric: unknown) =>
      typeof metric === "number" ? metric : typeof metric === "object" && metric && "value" in metric ? Number(metric.value) : null
    return { pageviews: read(data.pageviews), visitors: read(data.visitors) }
  } catch {
    return empty
  }
}

async function loadLastWeek() {
  const since = new Date(Date.now() - 7 * DAY)
  const [traffic, grouped] = await Promise.all([
    fetchUmamiTraffic(since),
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ])
  return { traffic, counts: new Map(grouped.map((row) => [row.type, row._count._all])) }
}

export async function AnalyticsPanel() {
  const { traffic, counts } = await loadLastWeek()

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Analytics · last 7 days</h2>
        <Link
          href="/stats"
          target="_blank"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Open Umami
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x">
        <StatCell label="Page views" value={traffic.pageviews} />
        <StatCell label="Visitors" value={traffic.visitors} />
        {EVENT_TYPES.map((type) => (
          <StatCell key={type} label={EVENT_LABELS[type]} value={counts.get(type) ?? 0} />
        ))}
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value === null ? "–" : value.toLocaleString("en-US")}</p>
    </div>
  )
}
