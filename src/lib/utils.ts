import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse Chilean date format: "dd/mm/yyyy HH:mm:ss"
 * Returns a Date object
 */
export function parseChileanDate(dateString: string): Date {
  // Handle format: "20/11/2025 09:55:37" or "20/11/2025"
  const parts = dateString.split(' ')
  const datePart = parts[0] // "20/11/2025"
  const timePart = parts[1] || '00:00:00' // "09:55:37"

  const [day, month, year] = datePart.split('/')
  const [hours, minutes, seconds] = timePart.split(':')

  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`)
}

export function formatDate(date: string | Date): string {
  let dateObj: Date

  if (typeof date === 'string') {
    // Check if it's Chilean format (contains slash)
    if (date.includes('/')) {
      dateObj = parseChileanDate(date)
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  // Validate the date
  if (isNaN(dateObj.getTime())) {
    console.warn(`Invalid date format: ${date}`)
    return '-'
  }

  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  let dateObj: Date

  if (typeof date === 'string') {
    // Check if it's Chilean format (contains slash)
    if (date.includes('/')) {
      dateObj = parseChileanDate(date)
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  // Validate the date
  if (isNaN(dateObj.getTime())) {
    console.warn(`Invalid date format: ${date}`)
    return '-'
  }

  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num);
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
