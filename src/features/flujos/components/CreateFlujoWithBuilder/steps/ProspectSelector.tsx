/**
 * Step 2: Prospect Selection
 * Allows user to select which prospects to include in the flow
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X, AlertCircle, Users } from 'lucide-react'
import type { Prospecto } from '@/types/prospecto'

interface ProspectSelectorProps {
  prospectos: Prospecto[]
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  onContinue: () => void
  originName: string
  onBack: () => void
  onClose: () => void
}

export function ProspectSelector({
  prospectos,
  selectedIds,
  onSelectionChange,
  onContinue,
  originName,
  onBack,
  onClose,
}: ProspectSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  /**
   * Toggle prospect selection
   */
  const handleToggle = useCallback(
    (prospecto: Prospecto) => {
      const newSelected = new Set(selectedIds)
      if (newSelected.has(prospecto.id)) {
        newSelected.delete(prospecto.id)
      } else {
        newSelected.add(prospecto.id)
      }
      onSelectionChange(newSelected)
    },
    [selectedIds, onSelectionChange]
  )

  /**
   * Select all visible prospects
   */
  const handleSelectAll = useCallback(() => {
    const filteredIds = new Set(
      filteredProspectos.map((p) => p.id)
    )
    onSelectionChange(filteredIds)
  }, [onSelectionChange])

  /**
   * Deselect all
   */
  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set())
  }, [onSelectionChange])

  /**
   * Filter prospects by search term
   */
  const filteredProspectos = prospectos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.telefono?.includes(searchTerm)
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-segal-dark/60">Origen seleccionado</p>
            <p className="text-lg font-bold text-segal-dark">{originName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-segal-dark/60">Total disponibles</p>
            <p className="text-lg font-bold text-segal-blue">{prospectos.length}</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-segal-blue/30 rounded-lg focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
        />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSelectAll}
            variant="outline"
            className="border-segal-green/20 text-segal-green hover:bg-segal-green/5"
          >
            <Check className="h-4 w-4 mr-2" />
            Seleccionar Todo
          </Button>
          <Button
            size="sm"
            onClick={handleDeselectAll}
            variant="outline"
            className="border-segal-red/20 text-segal-red hover:bg-segal-red/5"
          >
            <X className="h-4 w-4 mr-2" />
            Deseleccionar
          </Button>
        </div>

        {/* Prospects list */}
        <div className="flex-1 overflow-y-auto border border-segal-blue/10 rounded-lg">
          {filteredProspectos.length > 0 ? (
            <div className="divide-y divide-segal-blue/10">
              {filteredProspectos.map((prospecto) => (
                <div
                  key={prospecto.id}
                  onClick={() => handleToggle(prospecto)}
                  className="p-3 hover:bg-segal-blue/5 transition-colors cursor-pointer flex items-start gap-3"
                >
                  <Checkbox
                    checked={selectedIds.has(prospecto.id)}
                    onCheckedChange={() => handleToggle(prospecto)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-segal-dark text-sm">{prospecto.nombre}</p>
                    <div className="flex gap-4 mt-1 text-xs text-segal-dark/60 flex-wrap">
                      {prospecto.email && <span>📧 {prospecto.email}</span>}
                      {prospecto.telefono && <span>📱 {prospecto.telefono}</span>}
                      {prospecto.monto_deuda && (
                        <span>💰 ${prospecto.monto_deuda.toLocaleString('es-CL')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-segal-dark/60">
              <p>No se encontraron prospectos</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-segal-blue" />
            <p className="text-sm font-semibold text-segal-dark">
              <span className="text-segal-blue font-bold">{selectedIds.size}</span> de{' '}
              {prospectos.length} prospectos seleccionados
            </p>
          </div>
          {selectedIds.size === 0 && (
            <p className="text-xs text-segal-dark/60 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Debes seleccionar al menos un prospecto para continuar
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-segal-blue/10 bg-white p-6 flex justify-between gap-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
          >
            Atrás
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
          >
            Cancelar
          </Button>
        </div>
        <Button
          onClick={onContinue}
          disabled={selectedIds.size === 0}
          className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
        >
          Continuar al Constructor
        </Button>
      </div>
    </div>
  )
}
