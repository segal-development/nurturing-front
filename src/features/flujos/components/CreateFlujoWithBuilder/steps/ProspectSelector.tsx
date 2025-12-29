/**
 * Step 2: Prospect Selection
 * Allows user to select which prospects to include in the flow
 * Dynamically fetches debt categories from backend
 */

import { useCallback, useMemo, useState } from 'react'

import type { TipoProspecto } from '@/api/tiposProspecto.service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { findTipoByMonto, useTiposProspecto } from '@/hooks/useTiposProspecto'
import type { Prospecto } from '@/types/prospecto'
import { AlertCircle, Check, Loader2, Users, X } from 'lucide-react'

interface ProspectSelectorProps {
  prospectos: Prospecto[]
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  onTipoChange?: (tipoId: number | null) => void
  onContinue: () => void
  originName: string
  onBack: () => void
  onClose: () => void
}

export function ProspectSelector({
  prospectos,
  selectedIds,
  onSelectionChange,
  onTipoChange,
  onContinue,
  originName,
  onBack,
  onClose,
}: ProspectSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null)

  // Fetch tipos de prospecto from backend
  const { data: tiposProspecto, isLoading: loadingTipos } = useTiposProspecto()

  /**
   * Categorize prospectos by tipo using backend ranges
   */
  const categorizedProspectos = useMemo(() => {
    if (!tiposProspecto) return {}

    const result: Record<number, Prospecto[]> = {}

    // Initialize empty arrays for each tipo
    tiposProspecto.forEach((tipo) => {
      result[tipo.id] = []
    })

    // Categorize each prospecto
    prospectos.forEach((prospecto) => {
      const tipo = findTipoByMonto(tiposProspecto, prospecto.monto_deuda)
      if (tipo) {
        result[tipo.id].push(prospecto)
      }
    })

    return result
  }, [prospectos, tiposProspecto])

  /**
   * Infer tipo from selected prospectos based on majority
   * Returns the tipo that contains most of the selected prospectos
   */
  const inferTipoFromSelection = useCallback(
    (selectedProspectoIds: Set<number>): number | null => {
      if (!tiposProspecto || selectedProspectoIds.size === 0) return null

      // Count how many selected prospectos belong to each tipo
      const countByTipo: Record<number, number> = {}

      selectedProspectoIds.forEach((id) => {
        const prospecto = prospectos.find((p) => p.id === id)
        if (prospecto) {
          const tipo = findTipoByMonto(tiposProspecto, prospecto.monto_deuda)
          if (tipo) {
            countByTipo[tipo.id] = (countByTipo[tipo.id] || 0) + 1
          }
        }
      })

      // Find the tipo with the most prospectos
      let maxCount = 0
      let dominantTipoId: number | null = null

      Object.entries(countByTipo).forEach(([tipoId, count]) => {
        if (count > maxCount) {
          maxCount = count
          dominantTipoId = Number(tipoId)
        }
      })

      return dominantTipoId
    },
    [prospectos, tiposProspecto]
  )

  /**
   * Filter prospects by search term
   */
  const filteredProspectos = useMemo(
    () =>
      prospectos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.telefono?.includes(searchTerm)
      ),
    [prospectos, searchTerm]
  )

  /**
   * Select all prospectos of a specific tipo
   */
  const handleSelectTipo = useCallback(
    (tipo: TipoProspecto) => {
      const idsDelTipo = new Set(categorizedProspectos[tipo.id]?.map((p) => p.id) || [])

      setSelectedTipoId(tipo.id)
      onSelectionChange(idsDelTipo)
      onTipoChange?.(tipo.id)
    },
    [categorizedProspectos, onSelectionChange, onTipoChange]
  )

  /**
   * Toggle prospect selection - also infers tipo from selection
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

      // Infer tipo from the new selection
      const inferredTipo = inferTipoFromSelection(newSelected)
      setSelectedTipoId(inferredTipo)
      onTipoChange?.(inferredTipo)
    },
    [selectedIds, onSelectionChange, inferTipoFromSelection, onTipoChange]
  )

  /**
   * Select all visible prospects
   */
  const handleSelectAll = useCallback(() => {
    const ids = new Set(filteredProspectos.map((p) => p.id))
    onSelectionChange(ids)

    // Infer tipo from the selection
    const inferredTipo = inferTipoFromSelection(ids)
    setSelectedTipoId(inferredTipo)
    onTipoChange?.(inferredTipo)
  }, [filteredProspectos, onSelectionChange, inferTipoFromSelection, onTipoChange])

  /**
   * Deselect all
   */
  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set())
    setSelectedTipoId(null)
    onTipoChange?.(null)
  }, [onSelectionChange, onTipoChange])

  /**
   * Get the selected tipo name for display
   */
  const selectedTipoNombre = useMemo(() => {
    if (!selectedTipoId || !tiposProspecto) return null
    return tiposProspecto.find((t) => t.id === selectedTipoId)?.nombre || null
  }, [selectedTipoId, tiposProspecto])

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

        {/* Tipos de Deuda - Quick Select */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-segal-dark">Seleccionar por Tipo de Deuda:</p>

          {loadingTipos ? (
            <div className="flex items-center gap-2 text-sm text-segal-dark/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando tipos...
            </div>
          ) : tiposProspecto && tiposProspecto.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {tiposProspecto.map((tipo) => (
                <Button
                  key={tipo.id}
                  size="sm"
                  onClick={() => handleSelectTipo(tipo)}
                  variant={selectedTipoId === tipo.id ? 'default' : 'outline'}
                  className={
                    selectedTipoId === tipo.id
                      ? 'bg-segal-blue text-white'
                      : 'border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5'
                  }
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{tipo.nombre}</span>
                    <span className="text-xs font-bold">
                      {categorizedProspectos[tipo.id]?.length || 0}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-segal-dark/60">No hay tipos de prospecto disponibles</p>
          )}
        </div>

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
              {filteredProspectos.map((prospecto) => {
                const checkboxId = `prospecto-${prospecto.id}`
                return (
                  <div
                    key={prospecto.id}
                    className="p-3 hover:bg-segal-blue/5 transition-colors flex items-start gap-3"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedIds.has(prospecto.id)}
                      onCheckedChange={() => handleToggle(prospecto)}
                      className="mt-1"
                    />
                    <label htmlFor={checkboxId} className="flex-1 min-w-0 cursor-pointer">
                      <p className="font-medium text-segal-dark text-sm">{prospecto.nombre}</p>
                      <div className="flex gap-4 mt-1 text-xs text-segal-dark/60 flex-wrap">
                        {prospecto.email && <span>📧 {prospecto.email}</span>}
                        {prospecto.telefono && <span>📱 {prospecto.telefono}</span>}
                        {prospecto.monto_deuda && (
                          <span>💰 ${prospecto.monto_deuda.toLocaleString('es-CL')}</span>
                        )}
                      </div>
                    </label>
                  </div>
                )
              })}
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
              {selectedTipoNombre && (
                <span className="ml-2 text-xs text-segal-dark/60">
                  (Tipo: <span className="font-medium">{selectedTipoNombre}</span>)
                </span>
              )}
            </p>
          </div>
          {selectedIds.size === 0 && (
            <p className="text-xs text-segal-dark/60 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Debes seleccionar al menos un prospecto para continuar
            </p>
          )}
          {selectedIds.size > 0 && !selectedTipoId && (
            <p className="text-xs text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              No se pudo determinar el tipo de prospecto. Selecciona un tipo manualmente.
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
          disabled={selectedIds.size === 0 || !selectedTipoId}
          className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
        >
          Continuar al Constructor
        </Button>
      </div>
    </div>
  )
}
