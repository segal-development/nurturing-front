/**
 * Custom Stage Node for Flow Builder
 * Represents a nurturing stage/etapa in the flow
 * Supports editing inline with real-time updates
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import {
  Mail,
  MessageSquare,
  Settings2,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react'
import type { StageNodeData } from '../../../types/flowBuilder'
import { PlantillaSelector } from '../components/PlantillaSelector'

interface StageNodeProps extends NodeProps<StageNodeData> {
  onUpdate?: (id: string, data: Partial<StageNodeData>) => void
  onDelete?: (id: string) => void
  isSelected?: boolean
}

export function StageNode({
  id,
  data,
  onUpdate,
  onDelete,
  isSelected = false,
}: StageNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState(data)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use useLayoutEffect to measure and position the node
  useLayoutEffect(() => {
    if (containerRef.current) {
      const { height } = containerRef.current.getBoundingClientRect()
      // Can be used for dynamic positioning based on node height
      console.log(`Stage node ${id} height: ${height}`)
    }
  }, [id, isEditing])

  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    onUpdate?.(id, localData)
    setIsEditing(false)
  }, [id, localData, onUpdate])

  const handleCancel = useCallback(() => {
    setLocalData(data)
    setIsEditing(false)
  }, [data])

  const handleDelete = useCallback(() => {
    // Eliminar directamente sin confirmación (estilo n8n)
    onDelete?.(id)
  }, [id, onDelete])

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

  return (
    <>
      {/* Input handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Bottom} id="bottom" />

      <div
        ref={containerRef}
        className={`rounded-lg border-2 p-4 min-w-[220px] bg-white shadow-md transition-all duration-200 ${
          isSelected ? 'border-segal-blue ring-2 ring-segal-blue/20' : 'border-segal-blue/30'
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
              </div>
              {localData.activo && <CheckCircle2 className="h-4 w-4 text-segal-green shrink-0" />}
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

              {/* Template preview */}
              {localData.plantilla_mensaje && (
                <div className="mt-2 p-2 rounded bg-segal-blue/5 border border-segal-blue/10">
                  <p className="text-xs line-clamp-2 text-segal-dark">
                    "{localData.plantilla_mensaje.substring(0, 50)}
                    {localData.plantilla_mensaje.length > 50 ? '...' : ''}"
                  </p>
                </div>
              )}

              {/* Offer */}
              {localData.oferta && (
                <div className="text-xs text-segal-green font-medium">📦 {localData.oferta.titulo}</div>
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
                  value={localData.tiempo_espera ?? 0}
                  onChange={(e) =>
                    setLocalData({ ...localData, tiempo_espera: parseInt(e.target.value) || 0 })
                  }
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
                value={localData.tiempo_verificacion_condicion ?? 24}
                onChange={(e) =>
                  setLocalData({ ...localData, tiempo_verificacion_condicion: parseInt(e.target.value) || 24 })
                }
                className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
              />
              <p className="text-xs text-segal-dark/60">Se usa cuando hay una condición después de esta etapa</p>
            </div>

            {/* Custom Start Date (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Fecha Personalizada (Opcional)</label>
              <p className="text-xs text-segal-dark/60 mb-1">
                Usa esto para override de la fecha basada en días
              </p>
              <input
                type="date"
                value={localData.fecha_inicio_personalizada || ''}
                onChange={(e) =>
                  setLocalData({ ...localData, fecha_inicio_personalizada: e.target.value })
                }
                className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
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

      {/* Output handles */}
      <Handle type="source" position={Position.Top} id="top-out" />
      <Handle type="source" position={Position.Right} id="right-out" />
      <Handle type="source" position={Position.Bottom} id="bottom-out" />
    </>
  )
}
