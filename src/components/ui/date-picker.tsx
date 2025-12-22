"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Format string for displaying the date (date-fns format) */
  dateFormat?: string
  /** Minimum selectable date */
  fromDate?: Date
  /** Maximum selectable date */
  toDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  dateFormat = "PPP",
  fromDate,
  toDate,
}: DatePickerProps) {
  // Build disabled matcher for dates outside the allowed range
  const disabledMatcher = buildDisabledMatcher(fromDate, toDate)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600",
            !date && "text-muted-foreground dark:text-gray-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, dateFormat, { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={disabledMatcher}
          defaultMonth={date || fromDate || new Date()}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Build a disabled matcher array for react-day-picker v9
 */
function buildDisabledMatcher(fromDate?: Date, toDate?: Date): Matcher[] | undefined {
  const matchers: Matcher[] = []
  
  if (fromDate) {
    matchers.push({ before: fromDate })
  }
  
  if (toDate) {
    matchers.push({ after: toDate })
  }
  
  return matchers.length > 0 ? matchers : undefined
}

interface DateRangePickerProps {
  from: Date | undefined
  to: Date | undefined
  onFromChange: (date: Date | undefined) => void
  onToChange: (date: Date | undefined) => void
  placeholderFrom?: string
  placeholderTo?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  placeholderFrom = "Desde",
  placeholderTo = "Hasta",
  disabled = false,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DatePicker
        date={from}
        onDateChange={onFromChange}
        placeholder={placeholderFrom}
        disabled={disabled}
        toDate={to}
        className="flex-1"
      />
      <span className="text-muted-foreground">-</span>
      <DatePicker
        date={to}
        onDateChange={onToChange}
        placeholder={placeholderTo}
        disabled={disabled}
        fromDate={from}
        className="flex-1"
      />
    </div>
  )
}
