/**
 * Stage performance row component with progress bar
 * Displays per-stage statistics including sends, opens, and clicks
 */

import { Mail, MessageSquare, Eye, MousePointerClick } from 'lucide-react'

export type MessageType = 'email' | 'sms' | 'ambos'

export interface StageRowProps {
  label: string
  enviados: number
  abiertos: number | null
  clickeados: number | null
  tasaApertura: number | null
  tasaClick: number | null
  tipoMensaje: MessageType
  /** Maximum sends across all stages (for progress bar width calculation) */
  maxEnviados: number
}

export function StageRow({
  label,
  enviados,
  abiertos,
  clickeados,
  tasaApertura,
  tasaClick,
  tipoMensaje,
  maxEnviados,
}: StageRowProps) {
  const barWidth = maxEnviados > 0 ? (enviados / maxEnviados) * 100 : 0
  const isEmail = tipoMensaje === 'email' || tipoMensaje === 'ambos'

  return (
    <div className="bg-white rounded-lg border border-segal-blue/10 p-4 hover:border-segal-blue/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageTypeIcon tipoMensaje={tipoMensaje} />
          <span className="font-medium text-segal-dark">{label}</span>
        </div>
        <span className="text-sm font-semibold text-segal-blue">{enviados.toLocaleString()} enviados</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-segal-blue/10 rounded-full h-2 mb-3">
        <div 
          className="bg-gradient-to-r from-segal-blue to-segal-blue/70 h-2 rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stats row - only for email types */}
      {isEmail && (
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-blue-500" />
            <span className="text-segal-dark/70">
              {abiertos?.toLocaleString() ?? 0} abiertos
              {tasaApertura !== null && (
                <span className="text-blue-600 font-semibold ml-1">({tasaApertura}%)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MousePointerClick className="h-3 w-3 text-purple-500" />
            <span className="text-segal-dark/70">
              {clickeados?.toLocaleString() ?? 0} clicks
              {tasaClick !== null && (
                <span className="text-purple-600 font-semibold ml-1">({tasaClick}%)</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Helper component for message type icon */
function MessageTypeIcon({ tipoMensaje }: { tipoMensaje: MessageType }) {
  if (tipoMensaje === 'sms') {
    return <MessageSquare className="h-4 w-4 text-green-500" />
  }
  
  if (tipoMensaje === 'ambos') {
    return (
      <div className="flex gap-0.5">
        <Mail className="h-3 w-3 text-blue-500" />
        <MessageSquare className="h-3 w-3 text-green-500" />
      </div>
    )
  }
  
  return <Mail className="h-4 w-4 text-blue-500" />
}
