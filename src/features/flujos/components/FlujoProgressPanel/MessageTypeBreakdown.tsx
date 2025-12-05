/**
 * Componente para mostrar desglose de mensajes por tipo
 * Sigue Single Responsibility: solo renderiza desglose de tipos
 * Reutilizable y type-safe
 */

import { Mail, MessageSquare } from 'lucide-react'
import type { EjecucionFlujo } from '@/types/flujo'

interface MessageTypeBreakdownProps {
  /**
   * Estadísticas de ejecución
   */
  stats: EjecucionFlujo['stats']
}

/**
 * Componente para una fila de estadística
 */
function StatRow({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className="flex justify-between">
      <span className="text-segal-dark/70 dark:text-white/60">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  )
}

/**
 * Componente para un tipo de mensaje (Email o SMS)
 */
function MessageTypeCard({
  title,
  icon: Icon,
  enviados,
  fallidos,
}: {
  title: 'Email' | 'SMS'
  icon: typeof Mail
  enviados: number
  fallidos: number
}) {
  const total = enviados + fallidos

  return (
    <div className="bg-white border border-segal-blue/10 rounded-lg p-4 space-y-3">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-segal-blue" />
        <h4 className="font-semibold text-segal-dark">{title}</h4>
      </div>

      {/* Estadísticas */}
      <div className="space-y-2 text-sm">
        <StatRow label="Enviados" value={enviados} colorClass="text-green-600" />
        <StatRow label="Fallidos" value={fallidos} colorClass="text-red-600" />

        {/* Separador y total */}
        <div className="pt-2 border-t border-segal-blue/10">
          <StatRow label="Total" value={total} colorClass="text-segal-dark" />
        </div>
      </div>
    </div>
  )
}

export function MessageTypeBreakdown({ stats }: MessageTypeBreakdownProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-segal-dark">Desglose por Tipo de Mensaje</h3>

      <div className="grid grid-cols-2 gap-4">
        <MessageTypeCard
          title="Email"
          icon={Mail}
          enviados={stats.email_enviados}
          fallidos={stats.email_fallidos}
        />

        <MessageTypeCard
          title="SMS"
          icon={MessageSquare}
          enviados={stats.sms_enviados}
          fallidos={stats.sms_fallidos}
        />
      </div>
    </div>
  )
}
