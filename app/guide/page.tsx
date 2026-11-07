import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { GUIDE, type GuideRole } from "@/lib/guide"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Guide — PocketList" }

const TABS: { role: GuideRole; label: string }[] = [
  { role: "owner", label: "For owners" },
  { role: "tenant", label: "For tenants" },
]

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const t = await getT()
  const session = await auth()
  const { role: requested } = await searchParams
  const role: GuideRole =
    requested === "owner" || requested === "tenant"
      ? requested
      : session?.user?.role === "BUYER" ? "tenant" : "owner"

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">{t("How PocketList works")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Every step, from the first visit to a signed contract.")}</p>

        <nav className="mt-6 flex gap-2" aria-label={t("Guide")}>
          {TABS.map((tab) => (
            <Link
              key={tab.role}
              href={`/guide?role=${tab.role}`}
              aria-current={tab.role === role ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium",
                tab.role === role ? "border-primary/30 bg-primary/10 text-primary" : "border-input bg-card hover:bg-accent"
              )}
            >
              {t(tab.label)}
            </Link>
          ))}
        </nav>

        <ol className="mt-8 space-y-6">
          {GUIDE[role].map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 pt-1">
                <h2 className="font-semibold">{t(step.title)}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(step.text)}</p>
              </div>
            </li>
          ))}
        </ol>

        {!session?.user && (
          <Link href="/register" className="mt-8 inline-block">
            <Button>{t("Create an account")}</Button>
          </Link>
        )}
      </main>
    </div>
  )
}
