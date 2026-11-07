"use client"

import { useTheme } from "next-themes"
import { useT } from "@/components/I18nProvider"
import { useSyncExternalStore } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

const noop = () => () => {}

export function ThemeToggle({ row = false }: { row?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT()
  // The theme is only known in the browser, so the server renders a placeholder.
  const mounted = useSyncExternalStore(noop, () => true, () => false)

  if (!mounted) return <div className={row ? "h-8" : "w-8 h-8"} />

  return (
    <Button
      variant="ghost"
      size="sm"
      className={row ? "w-full justify-start gap-2" : "w-8 h-8 px-0"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={row ? undefined : t("Toggle theme")}
    >
      {!row && (resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
      {row && (resolvedTheme === "dark" ? t("Light theme") : t("Dark theme"))}
    </Button>
  )
}
