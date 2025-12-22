"use client"

import type { ComponentProps } from "react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"

import "react-day-picker/style.css"

export type CalendarProps = ComponentProps<typeof DayPicker>

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <>
      <style>{`
        .rdp-root {
          --rdp-accent-color: #086DBD;
          --rdp-accent-background-color: #086DBD15;
          --rdp-outside-opacity: 0.4;
          --rdp-day-font: inherit;
          --rdp-day_button-border-radius: 9999px;
          --rdp-day_button-width: 36px;
          --rdp-day_button-height: 36px;
        }
        .dark .rdp-root {
          --rdp-accent-color: #32BFD0;
          --rdp-accent-background-color: #32BFD020;
        }
        .rdp-root button {
          border-color: #e2e8f0 !important;
        }
        .dark .rdp-root button {
          border-color: #4b5563 !important;
        }
        .rdp-root button:hover {
          border-color: #cbd5e1 !important;
        }
        .dark .rdp-root button:hover {
          border-color: #6b7280 !important;
        }
        .rdp-today:not(.rdp-selected) .rdp-day_button {
          background-color: #f1f5f9;
        }
        .dark .rdp-today:not(.rdp-selected) .rdp-day_button {
          background-color: #374151;
        }
        .rdp-day {
          padding: 2px;
        }
        .rdp-weekday {
          padding: 8px 0;
        }
        .rdp-weeks {
          row-gap: 4px;
        }
        .dark .rdp-root {
          color: #fff;
        }
        .dark .rdp-weekday {
          color: #9ca3af;
        }
        .dark .rdp-day_button:hover {
          background-color: #374151;
        }
      `}</style>
      <DayPicker
        locale={es}
        className={cn("p-3", className)}
        {...props}
      />
    </>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
