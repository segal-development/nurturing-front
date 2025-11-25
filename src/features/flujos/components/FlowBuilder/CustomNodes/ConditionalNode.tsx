/**
 * Custom Conditional Node for Flow Builder
 * Represents branching logic (e.g., "Did user open email?")
 * Creates two outgoing paths: yes/true and no/false
 */

import { useCallback, useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { GitBranch, Settings2, Trash2 } from 'lucide-react'
import type { ConditionalNodeData, FlowCondition } from '../../../types/flowBuilder'

interface ConditionalNodeProps extends NodeProps<ConditionalNodeData> {
  onUpdate?: (id: string, data: Partial<ConditionalNodeData>) => void
  onDelete?: (id: string) => void
  isSelected?: boolean
}

const CONDITION_OPTIONS: Array<{ type: FlowCondition['type']; label: string }> = [
  { type: 'email_opened', label: 'Email abierto' },
  { type: 'link_clicked', label: 'Link clickeado' },
  { type: 'custom', label: 'Personalizado' },
]

export function ConditionalNode({
  id,
  data,
  onUpdate,
  onDelete,
  isSelected = false,
}: ConditionalNodeProps) {
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
    // Eliminar directamente sin confirmación (estilo n8n)
    onDelete?.(id)
  }, [id, onDelete])

  return (
    <>
      {/* Input handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Bottom} id="bottom" />

      <div
        className={`rounded-lg border-2 p-4 min-w-[240px] bg-white shadow-md transition-all duration-200 ${
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
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-segal-blue/10">
                    <GitBranch className="h-3 w-3 text-segal-blue" />
                  </div>
                  <h3 className="font-semibold text-sm text-segal-dark truncate">
                    {localData.label || 'Condición sin nombre'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Condition Display */}
            <div className="space-y-2 text-xs text-segal-dark/70">
              <div className="p-2 rounded bg-segal-blue/5 border border-segal-blue/10">
                <p className="font-medium text-segal-blue">📋 {localData.condition?.label || 'Sin condición'}</p>
              </div>

              {/* Yes/No Labels */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-1.5 rounded bg-segal-green/5 border border-segal-green/20">
                  <p className="text-xs font-medium text-segal-green">✓ {localData.yesLabel || 'Sí'}</p>
                </div>
                <div className="text-center p-1.5 rounded bg-segal-red/5 border border-segal-red/20">
                  <p className="text-xs font-medium text-segal-red">✗ {localData.noLabel || 'No'}</p>
                </div>
              </div>
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
              <label className="text-xs font-semibold text-segal-dark">Nombre de la Condición</label>
              <input
                type="text"
                value={localData.label || ''}
                onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                placeholder="Ej: ¿Abrió el email?"
              />
            </div>

            {/* Condition Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Tipo de Condición</label>
              <select
                value={localData.condition?.type || 'email_opened'}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    condition: {
                      ...localData.condition,
                      id: localData.condition?.id || `cond-${Date.now()}`,
                      type: e.target.value as any,
                      label: CONDITION_OPTIONS.find((opt) => opt.type === e.target.value)?.label || '',
                    },
                  })
                }
                className="w-full px-2 py-1 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-segal-dark">Descripción (Opcional)</label>
              <textarea
                value={localData.description || ''}
                onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 resize-none h-12"
                placeholder="Describe la condición..."
              />
            </div>

            {/* Yes/No Labels */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-green">Etiqueta "Sí"</label>
                <input
                  type="text"
                  value={localData.yesLabel || ''}
                  onChange={(e) => setLocalData({ ...localData, yesLabel: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-segal-green/30 rounded focus:border-segal-green focus:ring-1 focus:ring-segal-green/20"
                  placeholder="Ej: Abierto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-red">Etiqueta "No"</label>
                <input
                  type="text"
                  value={localData.noLabel || ''}
                  onChange={(e) => setLocalData({ ...localData, noLabel: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-segal-red/30 rounded focus:border-segal-red focus:ring-1 focus:ring-segal-red/20"
                  placeholder="Ej: No abierto"
                />
              </div>
            </div>

            {/* Actions */}
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

      {/* Two output handles for yes/no branches */}
      {/* Bottom handles - for vertical layout */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-yes`}
        style={{ left: '25%' }}
        title="Conexión para 'Sí' (condición verdadera)"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-no`}
        style={{ left: '75%' }}
        title="Conexión para 'No' (condición falsa)"
      />

      {/* Right handles - for horizontal layout */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-yes-right`}
        style={{ top: '30%' }}
        title="Conexión para 'Sí' (condición verdadera)"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-no-right`}
        style={{ top: '70%' }}
        title="Conexión para 'No' (condición falsa)"
      />
    </>
  )
}
