"use client"

import { useTheme } from "next-themes"
import { useT } from "@/components/I18nProvider"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ row = false }: { row?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className={row ? "h-8" : "w-8 h-8"} />

  return (
    <Button
      variant="ghost"
      size="sm"
      className={row ? "w-full justify-start gap-2" : "w-8 h-8 px-0"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={row ? undefined : t("Toggle theme")}
    >
      {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {row && (resolvedTheme === "dark" ? t("Light theme") : t("Dark theme"))}
    </Button>
  )
}
