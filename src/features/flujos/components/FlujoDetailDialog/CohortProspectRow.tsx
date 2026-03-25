/**
 * CohortProspectRow
 *
 * Compact row component displaying individual prospect information within
 * the cohort prospects drawer. Shows name, email, stage badge, send statistics,
 * and last send info.
 *
 * @module CohortProspectRow
 */

import {
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  XCircle,
  MousePointerClick,
  Eye,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CohortProspecto, EnvioEstado } from '@/types/flowExecutionTracking'

// ============================================================================
// Types
// ============================================================================

interface CohortProspectRowProps {
  prospect: CohortProspecto
  nodeLabel: string
  style?: React.CSSProperties
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats envio estado to a display label
 */
function getEstadoLabel(estado: EnvioEstado): string {
  const labels: Record<EnvioEstado, string> = {
    pendiente: 'Pendiente',
    enviado: 'Enviado',
    fallido: 'Fallido',
    abierto: 'Abierto',
    clickeado: 'Clickeado',
  }
  return labels[estado] ?? estado
}

/**
 * Gets color classes for an envio estado badge
 */
function getEstadoColorClass(estado: EnvioEstado): string {
  const colors: Record<EnvioEstado, string> = {
    pendiente: 'bg-slate-100 text-slate-600 border-slate-200',
    enviado: 'bg-blue-100 text-blue-700 border-blue-200',
    fallido: 'bg-red-100 text-red-700 border-red-200',
    abierto: 'bg-green-100 text-green-700 border-green-200',
    clickeado: 'bg-purple-100 text-purple-700 border-purple-200',
  }
  return colors[estado] ?? 'bg-slate-100 text-slate-600 border-slate-200'
}

/**
 * Gets icon for envio estado
 */
function getEstadoIcon(estado: EnvioEstado) {
  const iconClass = 'h-3 w-3'
  const icons: Record<EnvioEstado, React.ReactNode> = {
    pendiente: <Clock className={iconClass} />,
    enviado: <Mail className={iconClass} />,
    fallido: <XCircle className={iconClass} />,
    abierto: <Eye className={iconClass} />,
    clickeado: <MousePointerClick className={iconClass} />,
  }
  return icons[estado]
}

/**
 * Formats a date string to a readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '---'

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generates initials from a name
 */
function getInitials(nombre: string): string {
  const parts = nombre.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ============================================================================
// Sub-Components
// ============================================================================

interface EnviosPillProps {
  count: number
  label: string
  colorClass: string
  icon: React.ReactNode
}

function EnviosPill({ count, label, colorClass, icon }: EnviosPillProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
      )}
      title={`${count} ${label}`}
    >
      {icon}
      <span>{count}</span>
    </span>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Individual row component for a prospect in the cohort drawer
 *
 * @param prospect - Prospect data with send statistics
 * @param nodeLabel - Human-readable label for the current stage
 * @param style - Optional style for virtualized positioning
 */
export function CohortProspectRow({
  prospect,
  nodeLabel,
  style,
}: CohortProspectRowProps) {
  const { nombre, email, telefono, envios_resumen, ultimo_envio } = prospect

  // Calculate total successful sends (enviados + abiertos + clickeados)
  const totalExitosos =
    envios_resumen.enviados + envios_resumen.abiertos + envios_resumen.clickeados

  return (
    <div
      style={style}
      className="flex items-center gap-4 px-4 py-3 border-b border-segal-blue/10 hover:bg-segal-blue/5 transition-colors"
    >
      {/* Avatar with initials */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-segal-blue/10 flex items-center justify-center text-sm font-semibold text-segal-blue">
        {getInitials(nombre)}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        {/* Name and email */}
        <div className="flex items-center gap-2">
          <p className="font-medium text-segal-dark truncate">{nombre}</p>
          {/* Stage badge */}
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-segal-blue/10 text-segal-blue border border-segal-blue/20 whitespace-nowrap">
            {nodeLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-sm text-segal-dark/60">
          <span className="flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </span>
          {telefono && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{telefono}</span>
            </span>
          )}
        </div>
      </div>

      {/* Envio stats pills */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <EnviosPill
          count={totalExitosos}
          label="exitosos"
          colorClass="bg-green-100 text-green-700 border-green-200"
          icon={<CheckCircle2 className="h-3 w-3" />}
        />
        <EnviosPill
          count={envios_resumen.fallidos}
          label="fallidos"
          colorClass="bg-red-100 text-red-700 border-red-200"
          icon={<XCircle className="h-3 w-3" />}
        />
        <EnviosPill
          count={envios_resumen.abiertos}
          label="abiertos"
          colorClass="bg-blue-100 text-blue-700 border-blue-200"
          icon={<Eye className="h-3 w-3" />}
        />
        <EnviosPill
          count={envios_resumen.clickeados}
          label="clickeados"
          colorClass="bg-purple-100 text-purple-700 border-purple-200"
          icon={<MousePointerClick className="h-3 w-3" />}
        />
      </div>

      {/* Last send info */}
      <div className="flex-shrink-0 w-32 text-right">
        {ultimo_envio ? (
          <div>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                getEstadoColorClass(ultimo_envio.estado),
              )}
            >
              {getEstadoIcon(ultimo_envio.estado)}
              <span>{getEstadoLabel(ultimo_envio.estado)}</span>
            </span>
            <p className="text-xs text-segal-dark/50 mt-1">
              {formatDate(ultimo_envio.fecha)}
            </p>
          </div>
        ) : (
          <span className="text-xs text-segal-dark/40">Sin envíos</span>
        )}
      </div>
    </div>
  )
}
