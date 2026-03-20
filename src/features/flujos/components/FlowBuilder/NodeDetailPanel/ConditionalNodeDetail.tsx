/**
 * ConditionalNodeDetail — view + edit mode for Conditional node.
 * Shows condition type, parameters, operator, value, yes/no labels.
 * Edit mode: full condition editor with parameter selector, operator, value.
 *
 * Extracted from the old 380-line ConditionalNode inline rendering.
 */

import { useState } from 'react'
import { GitBranch } from 'lucide-react'
import type { ConditionalNodeData, FlowCondition } from '../../../types/flowBuilder'

interface ConditionalNodeDetailProps {
  nodeId: string
  data: ConditionalNodeData
  onUpdate: (nodeId: string, data: Partial<ConditionalNodeData>) => void
  onDelete: (nodeId: string) => void
  isReadOnly?: boolean
}

const CONDITION_OPTIONS: Array<{ type: FlowCondition['type']; label: string; description: string }> = [
  { type: 'email_opened', label: 'Email abierto', description: 'Verifica si el destinatario abrio el email' },
  { type: 'link_clicked', label: 'Link clickeado', description: 'Verifica si el destinatario hizo click en algun enlace' },
  { type: 'email_bounced', label: 'Email rebotado', description: 'Verifica si el email fue rechazado (bounce)' },
  { type: 'unsubscribed', label: 'Se dio de baja', description: 'Verifica si el destinatario se dio de baja' },
  { type: 'custom', label: 'Personalizado', description: 'Condicion personalizada con parametros manuales' },
]

const CHECK_PARAM_OPTIONS = [
  { value: 'Views', label: 'Aperturas (Views)', icon: '📧', hint: '¿Cuantas veces se abrio el email?' },
  { value: 'Clicks', label: 'Clicks en enlaces (Clicks)', icon: '🔗', hint: '¿Cuantos clicks en enlaces del email?' },
  { value: 'Bounces', label: 'Rebotes (Bounces)', icon: '⛔', hint: '¿Cuantos emails fueron rechazados?' },
  { value: 'Unsubscribes', label: 'Bajas (Unsubscribes)', icon: '🚫', hint: '¿Cuantos se dieron de baja?' },
] as const

const OPERATOR_OPTIONS = [
  { value: '>', label: 'Mayor que (>)' },
  { value: '>=', label: '>= Mayor o igual' },
  { value: '==', label: 'Igual (==)' },
  { value: '!=', label: 'No igual (!=)' },
  { value: '<', label: 'Menor que (<)' },
  { value: '<=', label: '<= Menor o igual' },
  { value: 'in', label: 'En lista (in)' },
  { value: 'not_in', label: 'No en lista (not_in)' },
] as const

function buildConditionUpdate(
  existing: FlowCondition | undefined,
  patch: Partial<FlowCondition>
): FlowCondition {
  return {
    id: existing?.id || `cond-${Date.now()}`,
    type: existing?.type || 'email_opened',
    label: existing?.label || 'Sin condicion',
    ...existing,
    ...patch,
  }
}

export function ConditionalNodeDetail({
  nodeId,
  data,
  onUpdate,
  onDelete,
  isReadOnly = false,
}: ConditionalNodeDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState<ConditionalNodeData>({ ...data })

  const handleSave = () => {
    onUpdate(nodeId, localData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalData({ ...data })
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(nodeId)
  }

  const updateCondition = (patch: Partial<FlowCondition>) => {
    setLocalData({
      ...localData,
      condition: buildConditionUpdate(localData.condition, patch),
    })
  }

  const selectedParamHint = CHECK_PARAM_OPTIONS.find(
    (p) => p.value === localData.condition?.check_param
  )?.hint

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-segal-dark truncate">
            {data.label || 'Condicion'}
          </h3>
          <p className="text-xs text-segal-dark/50">Nodo condicional</p>
        </div>
      </div>

      {!isEditing ? (
        /* View Mode */
        <div className="space-y-3">
          {/* Condition display */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-segal-dark">Condicion</p>
            <div className="p-2.5 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
              <p className="text-xs font-medium text-segal-blue">
                {data.condition?.label || 'Sin condicion'}
              </p>
            </div>
          </div>

          {/* Condition parameters */}
          {data.condition?.check_param && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-segal-dark">Parametros</p>
              <div className="p-2.5 rounded-lg bg-segal-green/5 border border-segal-green/10">
                <p className="text-xs font-medium text-segal-green">
                  {data.condition.check_param} {data.condition.check_operator} {data.condition.check_value}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {data.description && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-segal-dark">Descripcion</p>
              <p className="text-xs text-segal-dark/70 italic">{data.description}</p>
            </div>
          )}

          {/* Yes/No labels */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-lg bg-segal-green/5 border border-segal-green/20">
              <p className="text-xs font-medium text-segal-green">✓ {data.yesLabel || 'Si'}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-segal-red/5 border border-segal-red/20">
              <p className="text-xs font-medium text-segal-red">✗ {data.noLabel || 'No'}</p>
            </div>
          </div>

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
          {/* Label */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">Nombre de la Condicion</label>
            <input
              type="text"
              value={localData.label || ''}
              onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
              placeholder="Ej: ¿Abrio el email?"
            />
          </div>

          {/* Condition type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">Tipo de Condicion</label>
            <select
              value={localData.condition?.type || 'email_opened'}
              onChange={(e) => {
                const selected = CONDITION_OPTIONS.find((opt) => opt.type === e.target.value)
                updateCondition({
                  type: e.target.value as FlowCondition['type'],
                  label: selected?.label || '',
                })
              }}
              className="w-full px-2 py-1.5 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
            >
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Evaluation parameters */}
          <div className="space-y-2 p-3 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
            <p className="text-xs font-semibold text-segal-dark">Parametros de Evaluacion</p>

            {/* Check param */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-segal-dark">Parametro a verificar:</label>
              <select
                value={localData.condition?.check_param || 'Views'}
                onChange={(e) => updateCondition({ check_param: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
              >
                {CHECK_PARAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              {selectedParamHint && (
                <p className="text-xs text-segal-dark/50">{selectedParamHint}</p>
              )}
            </div>

            {/* Operator */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-segal-dark">Operador:</label>
              <select
                value={localData.condition?.check_operator || '>'}
                onChange={(e) =>
                  updateCondition({
                    check_operator: e.target.value as FlowCondition['check_operator'],
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
              >
                {OPERATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-segal-dark">Valor esperado:</label>
              <input
                type="text"
                value={localData.condition?.check_value || '0'}
                onChange={(e) => updateCondition({ check_value: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none"
                placeholder="0, 1 o lista separada por comas: 0,1,2"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-segal-dark">Descripcion (Opcional)</label>
            <textarea
              value={localData.description || ''}
              onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 focus:outline-none resize-none h-16"
              placeholder="Describe la condicion..."
            />
          </div>

          {/* Yes/No labels */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-segal-green">Etiqueta "Si"</label>
              <input
                type="text"
                value={localData.yesLabel || ''}
                onChange={(e) => setLocalData({ ...localData, yesLabel: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-segal-green/30 rounded focus:border-segal-green focus:ring-1 focus:ring-segal-green/20 focus:outline-none"
                placeholder="Ej: Abierto"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-segal-red">Etiqueta "No"</label>
              <input
                type="text"
                value={localData.noLabel || ''}
                onChange={(e) => setLocalData({ ...localData, noLabel: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-segal-red/30 rounded focus:border-segal-red focus:ring-1 focus:ring-segal-red/20 focus:outline-none"
                placeholder="Ej: No abierto"
              />
            </div>
          </div>

          {/* Save / Cancel */}
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
