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
      {/* Input handle - only top for cleaner design */}
      <Handle type="target" position={Position.Top} id="input" />

      <div
        className={`rounded-lg border-2 p-4 min-w-[280px] bg-white shadow-md transition-all duration-200 ${
          isSelected ? 'border-segal-blue ring-2 ring-segal-blue/20' : 'border-segal-blue/30'
        } ${isEditing ? 'ring-2 ring-segal-green/30' : ''}`}
        style={{ position: 'relative' }}
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

              {/* Condition Parameters Display */}
              {localData.condition?.check_param && (
                <div className="p-2 rounded bg-segal-green/5 border border-segal-green/10 space-y-1">
                  <p className="text-xs font-medium text-segal-green">
                    {localData.condition.check_param} {localData.condition.check_operator} {localData.condition.check_value}
                  </p>
                </div>
              )}

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

            {/* Condition Parameters */}
            <div className="space-y-2 p-3 bg-segal-blue/5 rounded border border-segal-blue/10">
              <p className="text-xs font-semibold text-segal-dark">Parámetros de Evaluación</p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-dark">Parámetro a verificar:</label>
                <select
                  value={localData.condition?.check_param || 'Views'}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      condition: {
                        ...localData.condition,
                        id: localData.condition?.id || `cond-${Date.now()}`,
                        type: localData.condition?.type || 'email_opened',
                        label: localData.condition?.label || 'Sin condición',
                        check_param: e.target.value,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                >
                  <option value="Views">Email abierto (Views)</option>
                  <option value="Clicks">Link clickeado (Clicks)</option>
                  <option value="Bounces">Email rechazado (Bounces)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-dark">Operador:</label>
                <select
                  value={localData.condition?.check_operator || '>'}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      condition: {
                        ...localData.condition,
                        id: localData.condition?.id || `cond-${Date.now()}`,
                        type: localData.condition?.type || 'email_opened',
                        label: localData.condition?.label || 'Sin condición',
                        check_operator: e.target.value,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                >
                  <option value=">">Mayor que (&gt;)</option>
                  <option value=">=">&gt;= Mayor o igual</option>
                  <option value="==">Igual (==)</option>
                  <option value="!=">No igual (!=)</option>
                  <option value="<">Menor que (&lt;)</option>
                  <option value="<=">&lt;= Menor o igual</option>
                  <option value="in">En lista (in)</option>
                  <option value="not_in">No en lista (not_in)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-segal-dark">Valor esperado:</label>
                <input
                  type="text"
                  value={localData.condition?.check_value || '0'}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      condition: {
                        ...localData.condition,
                        id: localData.condition?.id || `cond-${Date.now()}`,
                        type: localData.condition?.type || 'email_opened',
                        label: localData.condition?.label || 'Sin condición',
                        check_value: e.target.value,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                  placeholder="0, 1 o lista separada por comas: 0,1,2"
                />
              </div>
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

      {/* YES handle - Green, left bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-yes`}
        style={{
          left: '25%',
          width: '16px',
          height: '16px',
          background: '#059669',
          border: '3px solid #ffffff',
          boxShadow: '0 0 0 2px #059669, 0 2px 6px rgba(0,0,0,0.3)',
          cursor: 'crosshair',
          zIndex: 10,
        }}
        title="✓ Conexión para SÍ (condición verdadera)"
      />

      {/* NO handle - Red, right bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-no`}
        style={{
          left: '75%',
          width: '16px',
          height: '16px',
          background: '#dc2626',
          border: '3px solid #ffffff',
          boxShadow: '0 0 0 2px #dc2626, 0 2px 6px rgba(0,0,0,0.3)',
          cursor: 'crosshair',
          zIndex: 10,
        }}
        title="✗ Conexión para NO (condición falsa)"
      />

      {/* Visual labels for the handles */}
      <div
        style={{
          position: 'absolute',
          bottom: '-28px',
          left: '20%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#059669',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <span>✓</span>
        <span>SÍ</span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '-28px',
          left: '80%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#dc2626',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <span>✗</span>
        <span>NO</span>
      </div>
    </>
  )
}
