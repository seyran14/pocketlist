import type { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"

// Shared frame for the text pages: about, contact, terms and privacy.
export function TextPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-[28px] font-semibold sm:text-[34px]">{title}</h1>
        {intro && <div className="mt-3 text-muted-foreground">{intro}</div>}
        <div className="mt-8 space-y-8">{children}</div>
      </main>
    </div>
  )
}

export function TextSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}
