import Link from "next/link"

type PHInsight = {
  pageviews: number | null
  visitors: number | null
  sessions: number | null
}

async function fetchPostHogInsights(): Promise<PHInsight> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

  if (!apiKey || !projectId) return { pageviews: null, visitors: null, sessions: null }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dateFrom = sevenDaysAgo.toISOString().split("T")[0]
  const dateTo = now.toISOString().split("T")[0]

  try {
    const res = await fetch(
      `${host}/api/projects/${projectId}/insights/trend/?` +
        new URLSearchParams({
          events: JSON.stringify([
            { id: "$pageview", math: "total" },
            { id: "$pageview", math: "dau" },
          ]),
          date_from: dateFrom,
          date_to: dateTo,
          display: "BoldNumber",
        }),
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 300 }, // cache 5 min
      }
    )

    if (!res.ok) return { pageviews: null, visitors: null, sessions: null }

    const data = await res.json()
    const results = data.result ?? []

    const pageviews = results[0]?.aggregated_value ?? null
    const visitors = results[1]?.aggregated_value ?? null

    return { pageviews, visitors, sessions: null }
  } catch {
    return { pageviews: null, visitors: null, sessions: null }
  }
}

export async function AnalyticsPanel() {
  const hasKeys = !!(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID)

  if (!hasKeys) {
    return (
      <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Analytics</p>
        <p>
          Add <code className="text-xs bg-muted px-1 py-0.5 rounded">POSTHOG_PERSONAL_API_KEY</code> and{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">POSTHOG_PROJECT_ID</code> to{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> to see stats here.
        </p>
      </div>
    )
  }

  const stats = await fetchPostHogInsights()
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace("i.posthog.com", "posthog.com")
  const projectId = process.env.POSTHOG_PROJECT_ID

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Analytics · last 7 days</h2>
        <Link
          href={`${host}/project/${projectId}/insights`}
          target="_blank"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Open PostHog →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x">
        <StatCell
          label="Page Views"
          value={stats.pageviews}
          hint="Total pages loaded"
        />
        <StatCell
          label="Unique Visitors"
          value={stats.visitors}
          hint="Distinct users per day (avg)"
        />
        <div className="px-5 py-4 hidden sm:block">
          <p className="text-xs text-muted-foreground mb-1">Session Recordings</p>
          <Link
            href={`${host}/project/${projectId}/replay`}
            target="_blank"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            View replays →
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Heatmaps, clicks, scrolls</p>
        </div>
      </div>

      <div className="px-4 py-3 border-t bg-muted/30 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          <Link href={`${host}/project/${projectId}/events`} target="_blank" className="hover:text-foreground underline underline-offset-4">
            Events
          </Link>
        </span>
        <span>
          <Link href={`${host}/project/${projectId}/persons`} target="_blank" className="hover:text-foreground underline underline-offset-4">
            Users
          </Link>
        </span>
        <span>
          <Link href={`${host}/project/${projectId}/funnels`} target="_blank" className="hover:text-foreground underline underline-offset-4">
            Funnels
          </Link>
        </span>
        <span>
          <Link href={`${host}/project/${projectId}/heatmaps`} target="_blank" className="hover:text-foreground underline underline-offset-4">
            Heatmaps
          </Link>
        </span>
      </div>
    </div>
  )
}

function StatCell({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">
        {value === null ? (
          <span className="text-muted-foreground text-sm">—</span>
        ) : (
          value.toLocaleString()
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </div>
  )
}
