/**
 * Step 2: Prospect Selection
 * Allows user to select which prospects to include in the flow
 * Dynamically fetches debt categories from backend
 */

import { useState } from 'react'
import { logger } from '@/lib/logger'

import type { TipoProspecto } from '@/api/tiposProspecto.service'
import { Button } from '@/components/ui/button'
import { useProspectosConteoPorTipo } from '@/hooks/useProspectosConteoPorTipo'
import { useTiposProspecto } from '@/hooks/useTiposProspecto'
import type { Prospecto } from '@/types/prospecto'
import { AlertCircle, Loader2, Users, X } from 'lucide-react'

interface ProspectSelectorProps {
  prospectos: Prospecto[]
  totalEnBD: number
  selectedIds: Set<number>
  selectAllFromOrigin: boolean
  onSelectionChange: (ids: Set<number>) => void
  onSelectAllFromOriginChange: (selectAll: boolean) => void
  onTipoChange?: (tipoId: number | null) => void
  onSelectedCountChange?: (count: number) => void
  onContinue: () => void
  onContinueWithoutProspects?: () => void // New: allow skipping prospect selection
  originId: string
  originName: string
  onBack: () => void
  onClose: () => void
}

export function ProspectSelector({
  prospectos: _prospectos,
  totalEnBD,
  selectedIds,
  selectAllFromOrigin,
  onSelectionChange,
  onSelectAllFromOriginChange,
  onTipoChange,
  onSelectedCountChange,
  onContinue,
  onContinueWithoutProspects,
  originId,
  originName,
  onBack,
  onClose,
}: ProspectSelectorProps) {
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null)
  // Track if user selected "all types" (full origin) vs "all of specific type"
  const [isAllTypesSelected, setIsAllTypesSelected] = useState(false)

  // Fetch tipos de prospecto from backend
  const { data: tiposProspecto, isLoading: loadingTipos } = useTiposProspecto()

  // Fetch REAL counts from backend (not calculated from preview)
  const { data: conteoPorTipo, isLoading: loadingConteo } = useProspectosConteoPorTipo({
    origen: originId,
    enabled: !!originId,
  })

  /**
   * Map conteo data by tipo_id for easy lookup
   */
  const conteoByTipoId = (() => {
    if (!conteoPorTipo?.por_tipo) return {}
    return conteoPorTipo.por_tipo.reduce(
      (acc, item) => {
        acc[item.id] = item.total
        return acc
      },
      {} as Record<number, number>
    )
  })()

  /**
   * Deselect all / Clear selection
   */
  const handleDeselectAll = () => {
    onSelectionChange(new Set())
    onSelectAllFromOriginChange(false)
    setSelectedTipoId(null)
    setIsAllTypesSelected(false)
    onTipoChange?.(null)
    onSelectedCountChange?.(0)
  }

  /**
   * Select all prospects from origin of a SPECIFIC type
   */
  const handleSelectAllFromOrigin = (tipo: TipoProspecto) => {
    const tipoCount = conteoByTipoId[tipo.id] ?? 0
    onSelectAllFromOriginChange(true)
    onSelectionChange(new Set()) // Clear manual selection
    setSelectedTipoId(tipo.id)
    setIsAllTypesSelected(false) // Only this specific type
    onTipoChange?.(tipo.id)
    onSelectedCountChange?.(tipoCount)
  }

  /**
   * Get the selected tipo name for display
   */
  const selectedTipoNombre = (() => {
    if (!selectedTipoId || !tiposProspecto) return null
    return tiposProspecto.find((t) => t.id === selectedTipoId)?.nombre || null
  })()

  /**
   * Get the count of the selected tipo for display in summary
   */
  const selectedTipoCount = (() => {
    if (!selectedTipoId) return 0
    return conteoByTipoId[selectedTipoId] ?? 0
  })()

  /**
   * Find the "Todos" tipo (special type for selecting all prospects)
   */
  const getTodosTipoId = (): number | null => {
    if (!tiposProspecto || tiposProspecto.length === 0) return null

    const todosTipo = tiposProspecto.find(
      (tipo) => tipo.nombre.toLowerCase() === 'todos'
    )

    return todosTipo?.id ?? null
  }

  /**
   * Select ALL prospects from origin (all types) - uses "Todos" tipo
   */
  const handleSelectAllFromOriginAllTypes = () => {
    const todosTipoId = getTodosTipoId()

    if (todosTipoId === null) {
      logger.warn('No se encontró el tipo "Todos" en la base de datos')
    }

    onSelectAllFromOriginChange(true)
    onSelectionChange(new Set())
    setSelectedTipoId(todosTipoId)
    setIsAllTypesSelected(true) // ALL types selected
    onTipoChange?.(todosTipoId)
    onSelectedCountChange?.(totalEnBD) // All prospects from origin
  }

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
            <p className="text-lg font-bold text-segal-blue">{totalEnBD.toLocaleString('es-CL')}</p>
          </div>
        </div>

        {/* Tipos de Deuda - Quick Select */}
        <div className="space-y-3">
          {/* Button to select ALL prospects from origin */}
          {!loadingTipos && !loadingConteo && (
            <Button
              size="sm"
              onClick={handleSelectAllFromOriginAllTypes}
              variant={selectAllFromOrigin && isAllTypesSelected ? 'default' : 'outline'}
              className={
                selectAllFromOrigin && isAllTypesSelected
                  ? 'bg-segal-green text-white w-full'
                  : 'border-segal-green/30 text-segal-green hover:bg-segal-green/5 w-full'
              }
            >
              <Users className="h-4 w-4 mr-2" />
              Seleccionar Todos del Origen ({totalEnBD.toLocaleString('es-CL')})
            </Button>
          )}

          <p className="text-xs font-semibold text-segal-dark">O seleccionar por Tipo de Deuda:</p>

          {loadingTipos || loadingConteo ? (
            <div className="flex items-center gap-2 text-sm text-segal-dark/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando tipos...
            </div>
          ) : tiposProspecto && tiposProspecto.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {tiposProspecto
                  .filter((tipo) => tipo.nombre.toLowerCase() !== 'todos')
                  .map((tipo) => {
                    const realCount = conteoByTipoId[tipo.id] ?? 0
                    const isSelected = selectedTipoId === tipo.id && selectAllFromOrigin && !isAllTypesSelected

                    return (
                      <Button
                        key={tipo.id}
                        size="lg"
                        onClick={() => handleSelectAllFromOrigin(tipo)}
                        variant={isSelected ? 'default' : 'outline'}
                        className={
                          isSelected
                            ? 'bg-segal-blue text-white w-full h-auto py-3'
                            : 'border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5 w-full h-auto py-3'
                        }
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium">{tipo.nombre}</span>
                          <span className="text-lg font-bold">
                            {realCount.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </Button>
                    )
                  })}
              </div>
              {selectAllFromOrigin && selectedTipoId && (
                <div className="bg-segal-green/10 border border-segal-green/30 rounded p-2 text-xs text-segal-green">
                  {isAllTypesSelected ? (
                    <>✓ Seleccionarás <strong>{totalEnBD.toLocaleString('es-CL')} prospectos</strong> (sin distinción de tipo de deuda)</>
                  ) : (
                    <>✓ Seleccionarás <strong>{selectedTipoCount.toLocaleString('es-CL')} prospectos de {selectedTipoNombre}</strong> automáticamente</>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-segal-dark/60">No hay tipos de prospecto disponibles</p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-segal-blue" />
              <p className="text-sm font-semibold text-segal-dark">
              {selectAllFromOrigin ? (
                isAllTypesSelected ? (
                  <>
                    <span className="text-segal-green font-bold">
                      {totalEnBD.toLocaleString('es-CL')}
                    </span>{' '}
                    prospectos del origen serán seleccionados
                    <span className="ml-2 text-xs text-segal-dark/60">
                      (Todos los tipos de deuda)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-segal-green font-bold">
                      {selectedTipoCount.toLocaleString('es-CL')}
                    </span>{' '}
                    prospectos de <span className="font-bold">{selectedTipoNombre}</span> serán seleccionados
                  </>
                )
              ) : (
                <span className="text-segal-dark/60">Selecciona un tipo de deuda o todos los prospectos</span>
              )}
            </p>
            </div>
            {/* Limpiar selección - solo visible si hay algo seleccionado */}
            {(selectedIds.size > 0 || selectAllFromOrigin) && (
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-segal-red hover:text-segal-red/80 hover:underline flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpiar selección
              </button>
            )}
          </div>
          {selectedIds.size === 0 && !selectAllFromOrigin && (
            <p className="text-xs text-segal-dark/60 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Debes seleccionar al menos un prospecto o usar "Todos" para continuar
            </p>
          )}
          {(selectedIds.size > 0 || selectAllFromOrigin) && !selectedTipoId && (
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
        <div className="flex gap-3">
          {/* Option to skip prospect selection and add them later */}
          {onContinueWithoutProspects && (
            <Button
              variant="outline"
              onClick={onContinueWithoutProspects}
              className="border-amber-500/30 text-amber-600 hover:bg-amber-50"
            >
              Crear sin prospectos
            </Button>
          )}
          <Button
            onClick={onContinue}
            disabled={(selectedIds.size === 0 && !selectAllFromOrigin) || !selectedTipoId}
            className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
          >
            Continuar con prospectos
          </Button>
        </div>
      </div>
    </div>
  )
}
