"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Props = {
  page: number
  pages: number
  prevUrl: string
  nextUrl: string
}

export function PaginationBar({ page, pages, prevUrl, nextUrl }: Props) {
  const router = useRouter()

  function navigate(url: string) {
    const isMobile = window.matchMedia("(max-width: 640px)").matches
    router.push(url, { scroll: isMobile })
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <Button variant="outline" size="sm" disabled={page <= 1}
        onClick={() => page > 1 && navigate(prevUrl)}>
        ← Prev
      </Button>
      <span className="text-sm text-muted-foreground">{page} / {pages}</span>
      <Button variant="outline" size="sm" disabled={page >= pages}
        onClick={() => page < pages && navigate(nextUrl)}>
        Next →
      </Button>
    </div>
  )
}
