/**
 * Step 1.5: Lote (Batch) Selection
 * Allows user to select specific lotes from the chosen origin
 * This is an optional step - user can skip to select all lotes
 * Now includes nivel_deuda filtering for Sysgal lotes
 */

import { useState } from 'react'
import { Loader2, Package, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useLotesPorOrigen } from '@/hooks/useLotesPorOrigen'
import { NivelDeudaFilter } from './NivelDeudaFilter'
import type { LoteFlujo } from '@/api/flujos.service'

interface LoteSelectorProps {
  originId: string
  originName: string
  selectedLoteIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  onContinue: (metadataFilters?: Record<string, string[]>) => void
  onSkip: () => void // Skip lote selection, use all lotes
  onBack: () => void
  onClose: () => void
}

export function LoteSelector({
  originId,
  originName,
  selectedLoteIds,
  onSelectionChange,
  onContinue,
  onSkip,
  onBack,
  onClose,
}: LoteSelectorProps) {
  const { data, isLoading, error } = useLotesPorOrigen({ origen: originId })
  const [selectAll, setSelectAll] = useState(false)
  // Metadata filters (e.g., nivel_deuda)
  const [selectedNivelDeuda, setSelectedNivelDeuda] = useState<Set<string>>(new Set())

  const lotes = data?.lotes ?? []
  const totalProspectos = data?.total_prospectos ?? 0

  /**
   * Toggle selection of a single lote
   */
  const handleToggleLote = (loteId: number) => {
    const newSelection = new Set(selectedLoteIds)
    if (newSelection.has(loteId)) {
      newSelection.delete(loteId)
    } else {
      newSelection.add(loteId)
    }
    onSelectionChange(newSelection)
    setSelectAll(newSelection.size === lotes.length)
  }

  /**
   * Toggle select all lotes
   */
  const handleToggleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      onSelectionChange(new Set())
      setSelectAll(false)
    } else {
      // Select all
      const allIds = new Set(lotes.map((l) => l.id))
      onSelectionChange(allIds)
      setSelectAll(true)
    }
  }

  /**
   * Calculate total prospects from selected lotes
   */
  const selectedProspectosCount = lotes
    .filter((l) => selectedLoteIds.has(l.id))
    .reduce((acc, l) => acc + l.total_prospectos, 0)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="h-16 w-16 rounded-full bg-segal-blue/10 dark:bg-segal-blue/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-segal-blue animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-segal-dark dark:text-segal-light">Cargando Lotes</h3>
              <p className="text-sm text-segal-dark/60 dark:text-segal-light/60">
                Obteniendo los lotes de {originName}...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full p-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>Error al cargar los lotes</p>
            <p className="text-sm">{String(error)}</p>
          </div>
        </div>
        <div className="flex justify-between gap-3 pt-6 border-t border-segal-blue/10 dark:border-segal-blue/30">
          <Button variant="outline" onClick={onBack}>
            Atrás
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // No lotes found
  if (lotes.length === 0) {
    return (
      <div className="flex flex-col h-full p-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-segal-dark/60 dark:text-segal-light/60">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron lotes para este origen</p>
            <p className="text-sm mt-2">Podés continuar sin seleccionar lotes y agregarlos después</p>
          </div>
        </div>
        <div className="flex justify-between gap-3 pt-6 border-t border-segal-blue/10 dark:border-segal-blue/30">
          <Button variant="outline" onClick={onBack}>
            Atrás
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={onSkip}
              className="bg-segal-blue hover:bg-segal-blue/90 text-white"
            >
              Continuar sin lotes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-segal-dark/60 dark:text-segal-light/60">Origen seleccionado</p>
            <p className="text-lg font-bold text-segal-dark dark:text-segal-light">{originName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-segal-dark/60 dark:text-segal-light/60">Total en origen</p>
            <p className="text-lg font-bold text-segal-blue">
              {totalProspectos.toLocaleString('es-CL')} prospectos
            </p>
          </div>
        </div>

        {/* Select all / Skip option */}
        <div className="flex items-center justify-between bg-segal-blue/5 dark:bg-segal-blue/10 rounded-lg p-3 border border-segal-blue/10 dark:border-segal-blue/30">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleToggleSelectAll}
              className="border-segal-blue data-[state=checked]:bg-segal-blue"
            />
            <span className="text-sm font-medium text-segal-dark dark:text-segal-light">
              Seleccionar todos los lotes ({lotes.length})
            </span>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-segal-blue hover:text-segal-blue/80 hover:bg-segal-blue/10"
          >
            Omitir selección
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Lotes list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {lotes.map((lote) => (
            <LoteCard
              key={lote.id}
              lote={lote}
              isSelected={selectedLoteIds.has(lote.id)}
              onToggle={() => handleToggleLote(lote.id)}
            />
          ))}
        </div>

        {/* Nivel de Deuda Filter - shows only if lotes are selected */}
        {selectedLoteIds.size > 0 && (
          <NivelDeudaFilter
            loteIds={Array.from(selectedLoteIds)}
            selectedValues={selectedNivelDeuda}
            onSelectionChange={setSelectedNivelDeuda}
            className="mt-2"
          />
        )}

        {/* Summary */}
        <div className="bg-segal-green/10 dark:bg-segal-green/20 border border-segal-green/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-segal-green" />
              <span className="font-medium text-segal-dark dark:text-segal-light">
                {selectedLoteIds.size} lotes seleccionados
                {selectedNivelDeuda.size > 0 && ` · ${selectedNivelDeuda.size} niveles de deuda`}
              </span>
            </div>
            <span className="text-lg font-bold text-segal-green">
              {selectedProspectosCount.toLocaleString('es-CL')} prospectos
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-segal-blue/10 dark:border-segal-blue/30 bg-white dark:bg-gray-900 p-6 flex justify-between gap-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
          >
            Atrás
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
        <Button
          onClick={() => {
            // Build metadata filters if any nivel_deuda is selected
            const metadataFilters: Record<string, string[]> | undefined =
              selectedNivelDeuda.size > 0
                ? { nivel_deuda: Array.from(selectedNivelDeuda) }
                : undefined
            onContinue(metadataFilters)
          }}
          disabled={selectedLoteIds.size === 0}
          className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
        >
          Continuar con lotes seleccionados
        </Button>
      </div>
    </div>
  )
}

/**
 * Individual lote card component
 */
function LoteCard({
  lote,
  isSelected,
  onToggle,
}: {
  lote: LoteFlujo
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        w-full p-4 rounded-lg border-2 text-left transition-all duration-200
        ${
          isSelected
            ? 'border-segal-blue bg-segal-blue/5 dark:bg-segal-blue/10 shadow-sm'
            : 'border-segal-blue/20 dark:border-segal-blue/40 bg-white dark:bg-gray-800 hover:border-segal-blue/40 dark:hover:border-segal-blue/60'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={isSelected}
          className="border-segal-blue data-[state=checked]:bg-segal-blue pointer-events-none"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-segal-dark dark:text-segal-light truncate">{lote.nombre}</h4>
              {lote.clasificacion_value && (
                <span className="bg-segal-dark/10 dark:bg-segal-light/10 px-2 py-0.5 rounded text-xs text-segal-dark/60 dark:text-segal-light/60">
                  {lote.clasificacion_value}
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-segal-blue whitespace-nowrap">
              {lote.total_prospectos.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
