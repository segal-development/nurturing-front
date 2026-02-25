/**
 * Custom Stage Node for Flow Builder
 * Represents a nurturing stage/etapa in the flow
 * Supports editing inline with real-time updates
 */

import { useLayoutEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'

import { DatePicker } from '@/components/ui/date-picker'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { StageNodeData } from '../../../types/flowBuilder'
import { PlantillaSelector } from '../components/PlantillaSelector'

interface StageNodeProps extends NodeProps<StageNodeData> {
  isSelected?: boolean
  isNextNode?: boolean
  nextExecutionTime?: string
}

export function StageNode({
  id,
  data,
  isSelected = false,
  isNextNode = false,
  nextExecutionTime = '',
}: StageNodeProps) {
  // Callbacks and precios are injected into node.data by FlowBuilder's sync useEffect
  const onUpdate = data.onUpdate as ((id: string, data: Partial<StageNodeData>) => void) | undefined
  const onDelete = data.onDelete as ((id: string) => void) | undefined
  const precios = data.precios as { email: number; sms: number } | undefined
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState(data)

  // Sincronizar localData cuando data cambia (ej: cuando llegan estadísticas de ejecución)
  // Solo sincronizar si NO estamos editando para no perder cambios del usuario
  useLayoutEffect(() => {
    if (!isEditing) {
      setLocalData(data)
    }
  }, [data, isEditing])
  const containerRef = useRef<HTMLDivElement>(null)

  // Measure node height for dynamic positioning
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.getBoundingClientRect()
    }
  }, [id, isEditing])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate?.(id, localData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalData(data)
    setIsEditing(false)
  }

  const handleDelete = () => {
    // Eliminar directamente sin confirmación (estilo n8n)
    onDelete?.(id)
  }

  const getMessageIcon = (tipo: string) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'ambos':
        return (
          <div className="flex gap-1">
            <Mail className="h-3 w-3 text-blue-500" />
            <MessageSquare className="h-3 w-3 text-green-500" />
          </div>
        )
      default:
        return null
    }
  }

  /**
   * Calculate cost per prospect for this node based on message type
   */
  const getCostoNodo = (): number | null => {
    if (!precios) return null
    const tipo = localData.tipo_mensaje || 'email'
    switch (tipo) {
      case 'email':
        return precios.email
      case 'sms':
        return precios.sms
      case 'ambos':
        return precios.email + precios.sms
      default:
        return precios.email
    }
  }

  const costoNodo = getCostoNodo()

  return (
    <>
      {/* Input handle - only left side (n8n style) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className="!w-3 !h-3 !bg-segal-blue !border-2 !border-white"
      />

      <style>{`
        @keyframes spin-smooth {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 10px rgba(245, 158, 11, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(245, 158, 11, 0.8), inset 0 0 20px rgba(245, 158, 11, 0.2);
          }
        }
        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 35px rgba(59, 130, 246, 0.7), inset 0 0 15px rgba(59, 130, 246, 0.2);
          }
        }
        .executing-node {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .next-node {
          animation: pulse-blue 2.5s ease-in-out infinite;
        }
      `}</style>

      <div
        ref={containerRef}
        className={`rounded-xl border-2 p-4 min-w-[220px] bg-white shadow-md transition-all duration-200 ${
          // Estado de ejecución tiene prioridad en los estilos
          data.executionState === 'executing'
            ? 'border-amber-500 ring-2 ring-amber-400/30 executing-node'
            : data.executionState === 'completed'
              ? 'border-segal-green ring-2 ring-segal-green/20'
              : data.executionState === 'failed'
                ? 'border-segal-red ring-2 ring-segal-red/20'
                : data.executionState === 'pending'
                  ? 'border-gray-400 opacity-60'
                  : isNextNode
                    ? 'border-segal-blue ring-2 ring-segal-blue/30 next-node'
                    : isSelected
                    ? 'border-segal-blue ring-2 ring-segal-blue/20'
                    : 'border-segal-blue/30'
        } ${isEditing ? 'ring-2 ring-segal-green/30' : ''}`}
      >
        {!isEditing ? (
          // View Mode
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-segal-blue/10 text-xs font-bold text-segal-blue">
                    {id.split('-')[1]?.substring(0, 1) || '1'}
                  </div>
                  <h3 className="font-semibold text-sm text-segal-dark truncate">
                    {localData.label || 'Etapa sin nombre'}
                  </h3>
                </div>
                {!localData.activo && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    Inactiva
                  </span>
                )}
              {isNextNode && nextExecutionTime && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    ▶ Siguiente: {nextExecutionTime}
                  </span>
                )}
              </div>
              {/* Icons container - cost badge + execution state */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Cost Badge - always shown with tooltip */}
                {costoNodo !== null && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 cursor-help hover:bg-emerald-200 transition-colors">
                          <DollarSign className="h-3 w-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="bg-emerald-800 text-white border-emerald-700 px-3 py-2"
                      >
                        <div className="text-center">
                          <p className="font-semibold text-sm">${costoNodo.toLocaleString('es-CL')}</p>
                          <p className="text-xs text-emerald-200">por prospecto</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Execution State Icon */}
                {data.executionState === 'executing' && (
                  <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                )}
                {data.executionState === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {data.executionState === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {data.executionState === 'pending' && (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                {/* Active check when not in execution and no cost */}
                {!data.executionState && localData.activo && !costoNodo && (
                  <CheckCircle2 className="h-4 w-4 text-segal-green" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2 text-xs text-segal-dark/70">
              {/* Time to wait */}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-segal-blue/60" />
                <span>Espera: {localData.tiempo_espera ?? 0} días</span>
              </div>

              {/* Message Type */}
              <div className="flex items-center gap-2">
                {getMessageIcon(localData.tipo_mensaje || 'email')}
                <span className="capitalize">
                  {localData.tipo_mensaje ? (
                    localData.tipo_mensaje === 'ambos' ? 'Email + SMS' : localData.tipo_mensaje
                  ) : (
                    'Sin tipo'
                  )}
                </span>
              </div>

              {/* Condition verification time */}
              {localData.tiempo_verificacion_condicion && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-segal-blue/60" />
                  <span>Verifica en: {localData.tiempo_verificacion_condicion}h</span>
                </div>
              )}

              {/* Template preview - shows reference or inline content */}
              {localData.plantilla_type === 'reference' && (localData.plantilla_id || localData.plantilla_id_email) ? (
                <div className="mt-2 space-y-1">
                  {localData.plantilla_id && (
                    <div className="p-2 rounded bg-green-50 border border-green-200 flex items-center gap-2">
                      <span className="text-green-600 text-xs">📄</span>
                      <span className="text-xs font-medium text-green-800">
                        Plantilla #{localData.plantilla_id}
                      </span>
                    </div>
                  )}
                  {localData.plantilla_id_email && (
                    <div className="p-2 rounded bg-purple-50 border border-purple-200 flex items-center gap-2">
                      <span className="text-purple-600 text-xs">📧</span>
                      <span className="text-xs font-medium text-purple-800">
                        Plantilla Email #{localData.plantilla_id_email}
                      </span>
                    </div>
                  )}
                </div>
              ) : localData.plantilla_mensaje ? (
                <div className="mt-2 p-2 rounded bg-segal-blue/5 border border-segal-blue/10">
                  <p className="text-xs line-clamp-2 text-segal-dark">
                    "{localData.plantilla_mensaje.substring(0, 50)}
                    {localData.plantilla_mensaje.length > 50 ? '...' : ''}"
                  </p>
                </div>
              ) : (
                <div className="mt-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                  <p className="text-xs text-yellow-800">⚠️ Sin plantilla configurada</p>
                </div>
              )}

              {/* Offer */}
              {localData.oferta && typeof localData.oferta === 'object' && localData.oferta.titulo && (
                <div className="text-xs text-segal-green font-medium">📦 {String(localData.oferta.titulo)}</div>
              )}

              {/* Execution Stats (active execution) */}
              {data.executionState && data.envios && typeof data.envios === 'object' && (
                <div className="mt-3 pt-3 border-t border-segal-blue/10 space-y-1">
                  <p className="text-xs font-semibold text-segal-dark">Ejecución actual:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {typeof data.envios.enviado === 'number' && data.envios.enviado > 0 && (
                      <div className="flex items-center gap-1">
                        <Send className="h-3 w-3 text-green-600" />
                        <span className="text-green-600 font-semibold">{data.envios.enviado} enviados</span>
                      </div>
                    )}
                    {typeof data.envios.fallido === 'number' && data.envios.fallido > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-600" />
                        <span className="text-red-600 font-semibold">{data.envios.fallido} fallidos</span>
                      </div>
                    )}
                    {typeof data.envios.pendiente === 'number' && data.envios.pendiente > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span className="text-amber-600 font-semibold">{data.envios.pendiente} pendientes</span>
                      </div>
                    )}
                    {typeof data.envios.abierto === 'number' && data.envios.abierto > 0 && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-600 font-semibold">{data.envios.abierto} abiertos</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aggregated Stats (static view - all executions) */}
              {!data.executionState && data.aggregatedStats && typeof data.aggregatedStats === 'object' && (data.aggregatedStats.enviado > 0 || data.aggregatedStats.fallido > 0) && (
                <div className="mt-3 pt-3 border-t border-segal-blue/10 space-y-1">
                  <p className="text-xs font-semibold text-segal-dark">📊 Total histórico:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {typeof data.aggregatedStats.enviado === 'number' && data.aggregatedStats.enviado > 0 && (
                      <div className="flex items-center gap-1">
                        <Send className="h-3 w-3 text-green-600" />
                        <span className="text-green-600 font-semibold">{data.aggregatedStats.enviado.toLocaleString()} enviados</span>
                      </div>
                    )}
                    {typeof data.aggregatedStats.fallido === 'number' && data.aggregatedStats.fallido > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-600" />
                        <span className="text-red-600 font-semibold">{data.aggregatedStats.fallido.toLocaleString()} fallidos</span>
                      </div>
                    )}
                    {/* Email-specific stats: only show for email/ambos */}
                    {typeof data.aggregatedStats.abierto === 'number' && data.aggregatedStats.abierto > 0 && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-600 font-semibold">{data.aggregatedStats.abierto.toLocaleString()} abiertos</span>
                      </div>
                    )}
                    {typeof data.aggregatedStats.clickeado === 'number' && data.aggregatedStats.clickeado > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-purple-600" />
                        <span className="text-purple-600 font-semibold">{data.aggregatedStats.clickeado.toLocaleString()} clicks</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {data.errorMessage && typeof data.errorMessage === 'string' && (
                <div className="mt-3 p-2 rounded bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-semibold">Error:</p>
                  <p className="text-xs text-red-600 line-clamp-2">{data.errorMessage}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-segal-blue/10">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-segal-blue border border-segal-blue/20 hover:bg-segal-blue/5 transition-colors"
              >
                <Settings2 className="h-3 w-3" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium text-segal-red border border-segal-red/20 hover:bg-segal-red/5 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Nombre de la Etapa</label>
              <input
                type="text"
                value={localData.label || ''}
                onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                placeholder="Ej: Recordatorio inicial"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-dark">Tiempo de espera (días)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={localData.tiempo_espera ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value)
                    setLocalData({ ...localData, tiempo_espera: value as any })
                  }}
                  onBlur={(e) => {
                    // Al perder el foco, asegurar que sea un número válido
                    const value = parseInt(e.target.value)
                    setLocalData({ ...localData, tiempo_espera: isNaN(value) ? 0 : value })
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-dark">Tipo</label>
                <select
                  value={localData.tipo_mensaje || 'email'}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      tipo_mensaje: e.target.value as any,
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Tiempo antes de verificar condición (horas)</label>
              <input
                type="number"
                min="1"
                max="2160"
                value={localData.tiempo_verificacion_condicion ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value)
                  setLocalData({ ...localData, tiempo_verificacion_condicion: value as any })
                }}
                onBlur={(e) => {
                  // Al perder el foco, asegurar que sea un número válido (default 24)
                  const value = parseInt(e.target.value)
                  setLocalData({ ...localData, tiempo_verificacion_condicion: isNaN(value) ? 24 : value })
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
              />
              <p className="text-xs text-segal-dark/60">Se usa cuando hay una condición después de esta etapa</p>
            </div>

            {/* Custom Start Date (Optional) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-segal-dark">Fecha Personalizada (Opcional)</span>
              <p className="text-xs text-segal-dark/60 mb-1">
                Usa esto para override de la fecha basada en días
              </p>
              <DatePicker
                date={localData.fecha_inicio_personalizada ? parseISO(localData.fecha_inicio_personalizada) : undefined}
                onDateChange={(date) =>
                  setLocalData({ ...localData, fecha_inicio_personalizada: date ? format(date, 'yyyy-MM-dd') : '' })
                }
                placeholder="Seleccionar fecha"
                fromDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Plantilla</label>
              <PlantillaSelector
                tipo_mensaje={localData.tipo_mensaje}
                plantilla_id={localData.plantilla_id}
                plantilla_id_email={localData.plantilla_id_email}
                plantilla_mensaje={localData.plantilla_mensaje}
                plantilla_type={localData.plantilla_type}
                onChange={(data) => {
                  setLocalData({ ...localData, ...data })
                }}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localData.activo !== false}
                onChange={(e) => setLocalData({ ...localData, activo: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium text-segal-dark">Activo</span>
            </label>

            <div className="flex gap-2 pt-2 border-t border-segal-blue/10">
              <button
                onClick={handleSave}
                className="flex-1 px-2 py-1.5 bg-segal-green text-white text-xs font-medium rounded hover:bg-segal-green/90 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-2 py-1.5 border border-segal-blue/20 text-segal-blue text-xs font-medium rounded hover:bg-segal-blue/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Output handle - only right side (n8n style) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className="!w-3 !h-3 !bg-segal-blue !border-2 !border-white"
      />
    </>
  )
}
