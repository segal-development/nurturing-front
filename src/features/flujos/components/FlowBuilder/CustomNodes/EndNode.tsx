/**
 * Custom End Node for Flow Builder
 * Represents the end point of the nurturing flow
 * Supports editing name and deletion
 */

import { useCallback, useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { CheckCircle2, Settings2, Trash2 } from 'lucide-react'

interface EndNodeData {
  label: string
  description?: string
}

interface EndNodeProps extends NodeProps<EndNodeData> {
  onUpdate?: (id: string, data: Partial<EndNodeData>) => void
  onDelete?: (id: string) => void
  isSelected?: boolean
}

export function EndNode({
  id,
  data,
  onUpdate,
  onDelete,
  isSelected = false,
}: EndNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState(data)

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
    onDelete?.(id)
  }, [id, onDelete])

  return (
    <>
      {/* Input handle - only left side (n8n style) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className="!w-3 !h-3 !bg-segal-green !border-2 !border-white"
      />

      <div
        className={`rounded-lg border-2 p-4 min-w-[240px] bg-gradient-to-br from-segal-green/10 to-segal-green/5 shadow-md transition-all duration-200 ${
          isSelected ? 'border-segal-green ring-2 ring-segal-green/30' : 'border-segal-green/50'
        } ${isEditing ? 'ring-2 ring-segal-green/30' : ''}`}
      >
        {!isEditing ? (
          // View Mode
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-segal-green shrink-0" />
                <h3 className="font-bold text-sm text-segal-dark">{localData.label}</h3>
              </div>
            </div>

            <p className="text-xs text-segal-dark/50">Flujo completado</p>

            {localData.description && (
              <p className="text-xs text-segal-dark/70 italic">{localData.description}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-segal-green/10">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-segal-green border border-segal-green/20 hover:bg-segal-green/5 transition-colors"
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
              <label className="text-xs font-semibold text-segal-dark">Nombre del Fin</label>
              <input
                type="text"
                value={localData.label || ''}
                onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-segal-green/30 rounded focus:border-segal-green focus:ring-1 focus:ring-segal-green/20"
                placeholder="Ej: Flujo completado"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">
                Descripción (Opcional)
              </label>
              <textarea
                value={localData.description || ''}
                onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-segal-green/30 rounded focus:border-segal-green focus:ring-1 focus:ring-segal-green/20 resize-none h-12"
                placeholder="Describe este punto final..."
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-segal-green/10">
              <button
                onClick={handleSave}
                className="flex-1 px-2 py-1.5 bg-segal-green text-white text-xs font-medium rounded hover:bg-segal-green/90 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-2 py-1.5 border border-segal-green/20 text-segal-green text-xs font-medium rounded hover:bg-segal-green/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
