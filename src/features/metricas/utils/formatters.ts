/**
 * Formatting utilities for metrics display
 *
 * Pure functions following Single Responsibility Principle.
 * Each function handles one specific formatting concern.
 */

import { TREND_DIRECTION, type TrendDirection, type TrendData } from '@/types/metricas';

// ============================================================
// NUMBER FORMATTERS
// ============================================================

/**
 * Formats a number with thousand separators
 *
 * @example
 * formatNumber(1234567) // "1.234.567"
 * formatNumber(null) // "-"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('es-CL').format(value);
}

/**
 * Formats a number as a compact string (e.g., 1.2K, 3.4M)
 *
 * @example
 * formatCompactNumber(1234) // "1,2K"
 * formatCompactNumber(1234567) // "1,2M"
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('es-CL', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

// ============================================================
// PERCENTAGE FORMATTERS
// ============================================================

/**
 * Formats a number as a percentage
 *
 * @example
 * formatPercentage(45.678) // "45,68%"
 * formatPercentage(100) // "100%"
 */
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-';

  // Coerce to number in case backend sends string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '-';

  return `${numValue.toFixed(numValue % 1 === 0 ? 0 : 2).replace('.', ',')}%`;
}

/**
 * Formats a change percentage with sign
 *
 * @example
 * formatChangePercentage(15.5) // "+15,5%"
 * formatChangePercentage(-8.2) // "-8,2%"
 */
export function formatChangePercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-';

  // Coerce to number in case backend sends string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '-';

  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1).replace('.', ',')}%`;
}

// ============================================================
// DATE FORMATTERS
// ============================================================

/**
 * Formats an ISO date string to a short display format
 *
 * @example
 * formatDate("2024-01-15") // "15 ene"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/**
 * Formats an ISO date string to a full display format
 *
 * @example
 * formatDateFull("2024-01-15") // "15 de enero de 2024"
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats an ISO datetime string with time
 *
 * @example
 * formatDateTime("2024-01-15T10:30:00") // "15 ene 10:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats an hour number (0-23) to display format
 *
 * @example
 * formatHour(14) // "14:00"
 * formatHour(9) // "09:00"
 */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

// ============================================================
// TREND HELPERS
// ============================================================

/**
 * Determines if a trend is positive (good) based on metric type
 *
 * For most metrics, UP is good. For desuscripciones, DOWN is good.
 */
export function isTrendPositive(direction: TrendDirection, isInverseMetric = false): boolean {
  if (isInverseMetric) {
    return direction === TREND_DIRECTION.DOWN;
  }
  return direction === TREND_DIRECTION.UP;
}

/**
 * Gets the appropriate color class for a trend
 *
 * @param direction - The trend direction
 * @param isInverseMetric - Whether lower is better (e.g., unsubscribes)
 * @returns Tailwind color class
 */
export function getTrendColorClass(direction: TrendDirection, isInverseMetric = false): string {
  const isPositive = isTrendPositive(direction, isInverseMetric);

  if (direction === TREND_DIRECTION.STABLE) {
    return 'text-muted-foreground';
  }

  return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

/**
 * Gets the appropriate icon for a trend direction
 *
 * @returns Icon name for lucide-react
 */
export function getTrendIcon(direction: TrendDirection): 'TrendingUp' | 'TrendingDown' | 'Minus' {
  switch (direction) {
    case TREND_DIRECTION.UP:
      return 'TrendingUp';
    case TREND_DIRECTION.DOWN:
      return 'TrendingDown';
    default:
      return 'Minus';
  }
}

/**
 * Formats trend data for display
 */
export function formatTrendDisplay(trend: TrendData, isInverseMetric = false): {
  value: string;
  colorClass: string;
  icon: 'TrendingUp' | 'TrendingDown' | 'Minus';
  isPositive: boolean;
} {
  return {
    value: formatChangePercentage(trend.cambio_porcentaje),
    colorClass: getTrendColorClass(trend.direccion, isInverseMetric),
    icon: getTrendIcon(trend.direccion),
    isPositive: isTrendPositive(trend.direccion, isInverseMetric),
  };
}

// ============================================================
// URL FORMATTERS
// ============================================================

/**
 * Truncates a URL for display
 *
 * @example
 * truncateUrl("https://example.com/very/long/path/to/page") // "example.com/very/long..."
 */
export function truncateUrl(url: string, maxLength = 40): string {
  if (!url) return '-';

  // Remove protocol
  const withoutProtocol = url.replace(/^https?:\/\//, '');

  if (withoutProtocol.length <= maxLength) {
    return withoutProtocol;
  }

  return `${withoutProtocol.substring(0, maxLength)}...`;
}

// ============================================================
// PERIOD LABELS
// ============================================================

const PERIOD_LABELS: Record<number, string> = {
  7: 'Última semana',
  30: 'Últimos 30 días',
  90: 'Últimos 3 meses',
  365: 'Último año',
};

/**
 * Gets the display label for a period
 */
export function getPeriodLabel(dias: number): string {
  return PERIOD_LABELS[dias] || `Últimos ${dias} días`;
}
