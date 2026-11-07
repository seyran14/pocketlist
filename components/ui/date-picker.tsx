"use client"

import { useState } from "react"
import { Popover } from "@base-ui/react/popover"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale, useT } from "@/components/I18nProvider"
import { cn, formatAvailableDate } from "@/lib/utils"

// Days are "YYYY-MM-DD" strings, and the maths stays in UTC so a time zone can't shift a day.
const iso = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
const monthOf = (day: string) => {
  const [year, month] = day.split("-").map(Number)
  return { year, month: month - 1 }
}

function monthDays(year: number, month: number) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7 // Weeks start on Monday.
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return { offset, days: Array.from({ length: count }, (_, i) => iso(year, month, i + 1)) }
}

const NAV = "flex size-8 max-sm:size-10 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-30"

export function DatePicker({
  id, value, onChange, min, label, clearable = false, className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
  label: string
  clearable?: boolean
  className?: string
}) {
  const t = useT()
  const locale = useLocale()
  const today = new Date().toISOString().slice(0, 10)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => monthOf(value || min || today))

  const { offset, days } = monthDays(view.year, view.month)
  const first = iso(view.year, view.month, 1)
  const title = new Date(first).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" })
  // 1 January 2024 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, i + 1)).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" })
  )
  const move = (by: number) => setView(monthOf(iso(view.year, view.month + by, 1)))
  const pick = (day: string) => { onChange(day); setOpen(false) }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setView(monthOf(value || min || today))
      }}
    >
      <Popover.Trigger
        id={id}
        aria-label={label}
        data-touch-target
        className={cn(
          "flex h-8 items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-start text-sm outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <CalendarDays size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className={cn("truncate", !value && "text-muted-foreground")} suppressHydrationWarning>
          {value ? formatAvailableDate(value, locale) : t("Pick a date")}
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="w-72 max-w-[calc(100vw-2rem)] rounded-2xl border bg-card p-3 text-card-foreground shadow-pop outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <div className="flex items-center justify-between">
              <button type="button" className={NAV} aria-label={t("Previous month")} disabled={!!min && first <= min} onClick={() => move(-1)}>
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
              <p className="text-sm font-semibold capitalize" aria-live="polite">{title}</p>
              <button type="button" className={NAV} aria-label={t("Next month")} onClick={() => move(1)}>
                <ChevronRight size={16} className="rtl:rotate-180" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-muted-foreground" aria-hidden="true">
              {weekdays.map((day) => <span key={day} className="truncate py-1">{day}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {days.map((day, i) => {
                const selected = day === value
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!!min && day < min}
                    aria-pressed={selected}
                    aria-label={formatAvailableDate(day, locale)}
                    style={i === 0 ? { gridColumnStart: offset + 1 } : undefined}
                    onClick={() => pick(day)}
                    className={cn(
                      "mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors disabled:pointer-events-none disabled:text-muted-foreground/40",
                      selected ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted",
                      !selected && day === today && "font-semibold underline underline-offset-4"
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            {clearable && value && (
              <button type="button" className="mt-2 w-full rounded-lg py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => pick("")}>
                {t("Clear date")}
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
