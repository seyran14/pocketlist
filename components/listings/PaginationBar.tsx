"use client"

import { useT } from "@/components/I18nProvider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  page: number
  pages: number
  prevUrl: string
  nextUrl: string
}

export function PaginationBar({ page, pages, prevUrl, nextUrl }: Props) {
  const t = useT()
  const router = useRouter()

  function navigate(url: string) {
    const isMobile = window.matchMedia("(max-width: 640px)").matches
    router.push(url, { scroll: isMobile })
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <Button variant="outline" size="sm" disabled={page <= 1}
        onClick={() => page > 1 && navigate(prevUrl)}>
        <ChevronLeft className="rtl:rotate-180" />
        {t("Previous")}
      </Button>
      <span className="text-sm text-muted-foreground">{page} / {pages}</span>
      <Button variant="outline" size="sm" disabled={page >= pages}
        onClick={() => page < pages && navigate(nextUrl)}>
        {t("Next")}
        <ChevronRight className="rtl:rotate-180" />
      </Button>
    </div>
  )
}
