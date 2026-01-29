/**
 * EmailQualityCard - Muestra estadísticas de calidad de emails
 *
 * Principios aplicados:
 * - SRP: Solo se encarga de mostrar calidad de emails
 * - OCP: Extensible via props sin modificar el componente
 * - Early returns para reducir nesting
 * - Funciones pequeñas y reutilizables
 * - Tipos estrictos con TypeScript
 */

import { Mail, MailX, MailCheck, UserX, TrendingDown, DollarSign, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { CalidadEmails } from '@/api/dashboard.service'

// =============================================================================
// Types
// =============================================================================

interface EmailQualityCardProps {
  data: CalidadEmails | undefined
  className?: string
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  tooltip?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

// =============================================================================
// Constants
// =============================================================================

const VARIANT_STYLES = {
  default: 'text-segal-dark dark:text-white',
  success: 'text-segal-green dark:text-green-400',
  warning: 'text-segal-orange dark:text-orange-400',
  danger: 'text-segal-red dark:text-red-400',
} as const

const ICON_VARIANT_STYLES = {
  default: 'text-segal-blue dark:text-segal-turquoise',
  success: 'text-segal-green dark:text-green-400',
  warning: 'text-segal-orange dark:text-orange-400',
  danger: 'text-segal-red dark:text-red-400',
} as const

// =============================================================================
// Helper Functions
// =============================================================================

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CL').format(value)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

function getValidityVariant(tasa: number): 'success' | 'warning' | 'danger' {
  if (tasa >= 95) return 'success'
  if (tasa >= 85) return 'warning'
  return 'danger'
}

function getProgressColor(tasa: number): string {
  if (tasa >= 95) return 'bg-segal-green'
  if (tasa >= 85) return 'bg-segal-orange'
  return 'bg-segal-red'
}

// =============================================================================
// Sub-components
// =============================================================================

function StatItem({ icon, label, value, subtext, tooltip, variant = 'default' }: StatItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn('mt-0.5', ICON_VARIANT_STYLES[variant])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-segal-dark/60 dark:text-gray-400 truncate">
            {label}
          </p>
          {tooltip && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-segal-dark/40 dark:text-gray-500 cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={5}
                className="max-w-[250px] bg-segal-dark dark:bg-gray-800 text-white px-3 py-2 text-xs"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className={cn('text-lg font-bold', VARIANT_STYLES[variant])}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-segal-dark/50 dark:text-gray-500">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}

function ValidityProgressBar({ tasa }: { tasa: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-segal-dark/70 dark:text-gray-300">
          Tasa de Validez
        </span>
        <span className={cn(
          'text-sm font-bold',
          VARIANT_STYLES[getValidityVariant(tasa)]
        )}>
          {formatPercentage(tasa)}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={tasa}
          className="h-2 bg-segal-dark/10 dark:bg-gray-700"
        />
        <div
          className={cn(
            'absolute top-0 left-0 h-2 rounded-full transition-all duration-500',
            getProgressColor(tasa)
          )}
          style={{ width: `${tasa}%` }}
        />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-8 text-segal-dark/40 dark:text-gray-500">
      <Mail className="h-8 w-8 mr-3" />
      <span>Sin datos de calidad disponibles</span>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function EmailQualityCard({ data, className }: EmailQualityCardProps) {
  if (!data) {
    return (
      <Card className={cn(
        'border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900',
        className
      )}>
        <CardHeader>
          <CardTitle className="text-segal-dark dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
            Calidad de Lista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    )
  }

  const {
    emails_validos,
    emails_invalidos,
    desuscritos,
    tasa_validez,
    ahorro_estimado,
  } = data

  return (
    <TooltipProvider delayDuration={100}>
      <Card className={cn(
        'border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900',
        'hover:border-segal-blue/30 dark:hover:border-segal-blue/50',
        'hover:shadow-md transition-all duration-200',
        className
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-segal-dark dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
            Calidad de Lista
          </CardTitle>
          <p className="text-xs text-segal-dark/50 dark:text-gray-500">
            Actualizado cada 5 minutos
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <ValidityProgressBar tasa={tasa_validez} />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <StatItem
              icon={<MailCheck className="h-4 w-4" />}
              label="Emails Válidos"
              value={formatNumber(emails_validos)}
              variant="success"
              tooltip="Emails que pueden recibir mensajes correctamente"
            />

            <StatItem
              icon={<MailX className="h-4 w-4" />}
              label="Emails Inválidos"
              value={formatNumber(emails_invalidos)}
              variant="danger"
              tooltip="Emails con formato incorrecto o dominio inválido (ej: gmail.con, hotmal.com)"
            />

            <StatItem
              icon={<UserX className="h-4 w-4" />}
              label="Desuscritos"
              value={formatNumber(desuscritos)}
              variant="warning"
              tooltip="Prospectos que solicitaron no recibir más comunicaciones por email"
            />

            <StatItem
              icon={<DollarSign className="h-4 w-4" />}
              label="Ahorro Estimado"
              value={formatCurrency(ahorro_estimado)}
              subtext="por envío masivo"
              variant="success"
              tooltip="Dinero que se ahorra al no enviar emails a direcciones inválidas"
            />
          </div>

          {/* Warning if low validity */}
          {tasa_validez < 90 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-segal-orange/10 dark:bg-orange-950/30 border border-segal-orange/20 dark:border-orange-800">
              <TrendingDown className="h-4 w-4 text-segal-orange dark:text-orange-400 mt-0.5 shrink-0" />
              <p className="text-xs text-segal-orange dark:text-orange-300">
                La tasa de validez es baja. Considera revisar la calidad de las importaciones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
