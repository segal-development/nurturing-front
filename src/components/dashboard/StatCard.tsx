/**
 * StatCard - Presentational component for dashboard stat cards
 *
 * SRP: Only renders a single stat card with icon, value, and subtitle.
 * OCP: Extensible via props (cardClassName, iconClassName) without modification.
 */

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// Types
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  /** Full Tailwind classes for the Card (border, hover, etc.) */
  cardClassName: string;
  /** Tailwind color classes for the icon */
  iconClassName: string;
}

// =============================================================================
// Component
// =============================================================================

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  cardClassName,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cardClassName}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-segal-dark/70 dark:text-gray-400">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-segal-dark dark:text-white">
          {value}
        </div>
        <p className="text-xs text-segal-dark/60 dark:text-gray-500">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
