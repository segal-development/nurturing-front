/**
 * EndNodeDetail — view + edit mode for End node.
 * Shows label, description, "Flujo completado" text.
 * Edit mode: label + description fields.
 */

import { useState } from 'react'
import { CheckCircle2, Flag } from 'lucide-react'
import type { EndNodeData } from '../../../types/flowBuilder'

interface EndNodeDetailProps {
  nodeId: string
  data: EndNodeData
  onUpdate: (nodeId: string, data: Partial<EndNodeData>) => void
  onDelete: (nodeId: string) => void
  isReadOnly?: boolean
}

export function EndNodeDetail({
  nodeId,
  data,
  onUpdate,
  onDelete,
  isReadOnly = false,
}: EndNodeDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState({
    label: data.label || '',
    description: data.description || '',
  })

  const handleSave = () => {
    onUpdate(nodeId, localData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalData({
      label: data.label || '',
      description: data.description || '',
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(nodeId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
          <Flag className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-segal-dark truncate">
            {data.label || 'Fin'}
          </h3>
          <p className="text-xs text-segal-dark/50">Nodo final</p>
        </div>
      </div>

      {!isEditing ? (
        /* View Mode */
        <div className="space-y-3">
          {/* Completion indicator */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-xs font-medium text-green-800">Flujo completado</span>
          </div>

          {/* Description */}
          {data.description && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-segal-dark">Descripcion</p>
              <p className="text-xs text-segal-dark/70 italic">{data.description}</p>
            </div>
          )}

          {/* Execution state */}
          {data.executionState && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-segal-dark">Estado</p>
              <p className="text-xs text-segal-dark/70 capitalize">{data.executionState}</p>
            </div>
          )}

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-1.5 rounded text-xs font-medium text-segal-blue border border-segal-blue/20 hover:bg-segal-blue/5 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded text-xs font-medium text-segal-red border border-segal-red/20 hover:bg-segal-red/5 transition-colors"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">Nombre del Fin</label>
            <input
              type="text"
              value={localData.label}
              onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-segal-green/30 rounded focus:border-segal-green focus:ring-1 focus:ring-segal-green/20 focus:outline-none"
              placeholder="Ej: Flujo completado"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">
              Descripcion (Opcional)
            </label>
            <textarea
              value={localData.description}
              onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-segal-green/30 rounded focus:border-segal-green focus:ring-1 focus:ring-segal-green/20 focus:outline-none resize-none h-16"
              placeholder="Describe este punto final..."
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 bg-segal-green text-white text-xs font-medium rounded hover:bg-segal-green/90 transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 border border-segal-blue/20 text-segal-blue text-xs font-medium rounded hover:bg-segal-blue/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
