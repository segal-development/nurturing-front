/**
 * Modal para agregar prospectos a un flujo existente
 * Permite seleccionar prospectos de un origen específico
 * Incluye filtro de nivel de deuda para orígenes de Sysgal
 */

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Filter, Loader2, Users } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { flujosService, type OrigenFlujo } from '@/api/flujos.service'
import { useFlujoOpciones } from '@/features/flujos/hooks/useFlujoOpciones'
import { useTiposProspecto } from '@/hooks/useTiposProspecto'
import { useProspectosConteoPorTipo } from '@/hooks/useProspectosConteoPorTipo'
import { useMetadataValues, NIVEL_DEUDA_LABELS, NIVEL_DEUDA_COLORS } from '@/hooks/useMetadataValues'
import { useLotesPorOrigen } from '@/hooks/useLotesPorOrigen'
import type { FlujoNurturing } from '@/types/flujo'

interface AddProspectsModalProps {
  flujo: FlujoNurturing | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Helper to detect if origin is Sysgal-related
function isSysgalOrigin(originName: string): boolean {
  const lower = originName.toLowerCase()
  return lower.includes('sysgal') || lower.includes('defensor')
}

export function AddProspectsModal({
  flujo,
  isOpen,
  onClose,
  onSuccess,
}: AddProspectsModalProps) {
  // State
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null)
  const [selectedOriginName, setSelectedOriginName] = useState<string>('')
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null)
  const [isAllTypes, setIsAllTypes] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNivelDeuda, setSelectedNivelDeuda] = useState<Set<string>>(new Set())

  // Fetch options
  const { data: opciones } = useFlujoOpciones()
  const { data: tiposProspecto, isLoading: loadingTipos } = useTiposProspecto()
  
  // Fetch counts for selected origin
  const { data: conteoPorTipo, isLoading: loadingConteo } = useProspectosConteoPorTipo({
    origen: selectedOriginId || '',
    enabled: !!selectedOriginId,
  })

  // Check if origin is Sysgal-related (may need nivel_deuda filter)
  const isSysgalRelated = Boolean(selectedOriginId && isSysgalOrigin(selectedOriginName))

  // Fetch lotes for the selected origin (needed to filter nivel_deuda correctly)
  const { data: lotesData, isLoading: loadingLotes } = useLotesPorOrigen({
    origen: selectedOriginId,
    enabled: isSysgalRelated,
  })

  // Extract lote_ids from the selected origin
  const loteIdsForOrigin = useMemo(() => {
    if (!lotesData?.lotes || lotesData.lotes.length === 0) return undefined
    return lotesData.lotes.map((l) => l.id)
  }, [lotesData])

  // Fetch nivel_deuda values for Sysgal origins - NOW filtered by lote_ids
  const { data: nivelDeudaData, isLoading: loadingNivelDeuda } = useMetadataValues(
    'nivel_deuda',
    loteIdsForOrigin, // Filter by the lotes belonging to this origin
    isSysgalRelated && !!loteIdsForOrigin
  )

  const nivelDeudaValores = nivelDeudaData?.valores ?? []

  // Only show nivel_deuda filter if:
  // 1. Origin is Sysgal-related AND
  // 2. We have lotes for this origin AND
  // 3. We have nivel_deuda data available
  // Otherwise, show the regular tipo selection or allow adding all prospects
  const showNivelDeudaFilter = isSysgalRelated && loteIdsForOrigin && loteIdsForOrigin.length > 0 && nivelDeudaValores.length > 0

  // For Sysgal origins without lotes/nivel_deuda data, allow adding all prospects directly
  const sysgalWithoutNivelDeuda = isSysgalRelated && !loadingLotes && !loadingNivelDeuda && !showNivelDeudaFilter

  // Derived state
  const totalProspectosOrigen = conteoPorTipo?.total ?? 0
  
  const conteoByTipoId = useMemo(() => {
    if (!conteoPorTipo?.por_tipo) return {}
    return conteoPorTipo.por_tipo.reduce(
      (acc, item) => {
        acc[item.id] = item.total
        return acc
      },
      {} as Record<number, number>
    )
  }, [conteoPorTipo])

  // Calculate selected count
  const selectedCount = useMemo(() => {
    // For Sysgal with nivel_deuda filter: use nivel_deuda counts directly
    if (showNivelDeudaFilter && selectedNivelDeuda.size > 0 && nivelDeudaValores.length > 0) {
      return nivelDeudaValores
        .filter(v => selectedNivelDeuda.has(v.valor))
        .reduce((acc, v) => acc + v.total, 0)
    }

    // For Sysgal without nivel_deuda data: use total from origin when "all" is selected
    if (sysgalWithoutNivelDeuda && isAllTypes) {
      return totalProspectosOrigen
    }

    // For non-Sysgal: use tipo counts
    if (isAllTypes) {
      return totalProspectosOrigen
    } else if (selectedTipoId) {
      return conteoByTipoId[selectedTipoId] ?? 0
    }

    return 0
  }, [isAllTypes, selectedTipoId, totalProspectosOrigen, conteoByTipoId, showNivelDeudaFilter, selectedNivelDeuda, nivelDeudaValores, sysgalWithoutNivelDeuda])

  const getTodosTipoId = useCallback((): number | null => {
    if (!tiposProspecto || tiposProspecto.length === 0) return null
    const todosTipo = tiposProspecto.find((tipo) => tipo.nombre.toLowerCase() === 'todos')
    return todosTipo?.id ?? null
  }, [tiposProspecto])

  // Handlers
  const handleSelectOrigin = (origen: OrigenFlujo) => {
    setSelectedOriginId(origen.id)
    setSelectedOriginName(origen.nombre)
    setSelectedTipoId(null)
    setIsAllTypes(false)
    setSelectedNivelDeuda(new Set())
  }

  const handleSelectAllTypes = () => {
    setIsAllTypes(true)
    setSelectedTipoId(getTodosTipoId())
  }

  const handleSelectTipo = (tipoId: number) => {
    setIsAllTypes(false)
    setSelectedTipoId(tipoId)
  }

  const handleToggleNivelDeuda = (valor: string) => {
    const newSelection = new Set(selectedNivelDeuda)
    if (newSelection.has(valor)) {
      newSelection.delete(valor)
    } else {
      newSelection.add(valor)
    }
    setSelectedNivelDeuda(newSelection)
  }

  const handleSelectAllNivelDeuda = () => {
    if (selectedNivelDeuda.size === nivelDeudaValores.length) {
      setSelectedNivelDeuda(new Set())
    } else {
      setSelectedNivelDeuda(new Set(nivelDeudaValores.map(v => v.valor)))
    }
  }

  const handleAddProspects = async () => {
    if (!flujo?.id || !selectedOriginId) {
      toast.error('Error: Faltan datos requeridos')
      return
    }

    // For Sysgal without nivel_deuda data: require "all types" selection
    if (sysgalWithoutNivelDeuda && !isAllTypes) {
      toast.error('Debes seleccionar "Todos" para agregar los prospectos')
      return
    }

    // For non-Sysgal origins (and Sysgal with nivel_deuda), require tipo or nivel_deuda selection
    if (!sysgalWithoutNivelDeuda && !showNivelDeudaFilter && !isAllTypes && !selectedTipoId) {
      toast.error('Debes seleccionar un tipo de deuda')
      return
    }

    // For Sysgal origins with nivel_deuda filter, require nivel_deuda selection
    if (showNivelDeudaFilter && selectedNivelDeuda.size === 0) {
      toast.error('Debes seleccionar al menos un nivel de deuda')
      return
    }

    setIsLoading(true)
    try {
      // Build metadata filters if nivel_deuda is selected
      const metadataFilters: Record<string, string[]> = {}
      if (showNivelDeudaFilter && selectedNivelDeuda.size > 0) {
        metadataFilters['nivel_deuda'] = Array.from(selectedNivelDeuda)
      }

      const result = await flujosService.agregarProspectos(flujo.id, {
        origen: selectedOriginId,
        tipo_prospecto_id: selectedTipoId,
        select_all_from_origin: true,
        canal_asignado: 'email',
        metadata_filters: Object.keys(metadataFilters).length > 0 ? metadataFilters : undefined,
      })

      if (result.resumen.procesamiento_async) {
        toast.success('Procesamiento iniciado', {
          description: `Se están agregando ~${result.resumen.total_estimado?.toLocaleString()} prospectos en segundo plano`,
        })
      } else {
        toast.success('Prospectos agregados', {
          description: `${result.resumen.agregados?.toLocaleString()} agregados, ${result.resumen.ya_existentes?.toLocaleString()} ya existían`,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string }
      const errorMessage = err.response?.data?.mensaje || err.message || 'Error al agregar prospectos'
      toast.error('Error', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOriginId(null)
      setSelectedOriginName('')
      setSelectedTipoId(null)
      setIsAllTypes(false)
      setSelectedNivelDeuda(new Set())
      onClose()
    }
  }

  if (!flujo) return null

  // Determine if step 2 is complete based on the selection type:
  // - Sysgal with nivel_deuda filter: need nivel_deuda selection
  // - Sysgal without nivel_deuda data: need "all types" selection
  // - Non-Sysgal: need tipo or "all types" selection
  const isStepTwoComplete = showNivelDeudaFilter 
    ? selectedNivelDeuda.size > 0 
    : sysgalWithoutNivelDeuda
      ? isAllTypes
      : (isAllTypes || selectedTipoId !== null)
  
  // Form is complete when step 2 is complete
  const isFormComplete = isStepTwoComplete

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Prospectos</DialogTitle>
          <DialogDescription>
            Selecciona el origen y tipo de prospectos para agregar al flujo &quot;{flujo.nombre}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Origin */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-segal-dark">1. Selecciona el origen</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {opciones?.origenes?.map((origen: OrigenFlujo) => {
                const isSelected = selectedOriginId === origen.id
                return (
                  <button
                    key={origen.id}
                    type="button"
                    onClick={() => handleSelectOrigin(origen)}
                    className={`
                      w-full text-left px-4 py-3 transition-colors duration-150
                      flex items-center justify-between gap-3
                      ${isSelected 
                        ? 'bg-segal-blue text-white' 
                        : 'bg-white text-segal-dark hover:bg-segal-blue/5'
                      }
                    `}
                  >
                    <span className="text-sm font-medium truncate">{origen.nombre}</span>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Select Type (only if origin selected AND not Sysgal with nivel_deuda) */}
          {selectedOriginId && !showNivelDeudaFilter && !sysgalWithoutNivelDeuda && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-segal-dark">2. Selecciona el tipo de prospecto</label>
              
              {loadingTipos || loadingConteo ? (
                <div className="flex items-center gap-2 text-sm text-segal-dark/60 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando tipos...
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select All Button */}
                  <Button
                    variant={isAllTypes ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleSelectAllTypes}
                    className={`w-full ${isAllTypes 
                      ? 'bg-segal-green text-white' 
                      : 'border-segal-green/30 text-segal-green hover:bg-segal-green/5'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Todos los tipos ({totalProspectosOrigen.toLocaleString()})
                  </Button>

                  {/* Type Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {tiposProspecto
                      ?.filter((tipo) => tipo.nombre.toLowerCase() !== 'todos')
                      .map((tipo) => {
                        const count = conteoByTipoId[tipo.id] ?? 0
                        const isSelected = selectedTipoId === tipo.id && !isAllTypes

                        return (
                          <Button
                            key={tipo.id}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSelectTipo(tipo.id)}
                            className={isSelected 
                              ? 'bg-segal-blue text-white' 
                              : 'border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5'
                            }
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs">{tipo.nombre}</span>
                              <span className="text-sm font-bold">{count.toLocaleString()}</span>
                            </div>
                          </Button>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 for Sysgal without nivel_deuda data: Show "Add All" option */}
          {sysgalWithoutNivelDeuda && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-segal-dark">2. Confirmar selección</label>
              
              {loadingLotes || loadingConteo ? (
                <div className="flex items-center gap-2 text-sm text-segal-dark/60 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando datos...
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant={isAllTypes ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleSelectAllTypes}
                    className={`w-full ${isAllTypes 
                      ? 'bg-segal-green text-white' 
                      : 'border-segal-green/30 text-segal-green hover:bg-segal-green/5'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Agregar todos los prospectos ({totalProspectosOrigen.toLocaleString()})
                  </Button>
                  <p className="text-xs text-segal-dark/50 text-center">
                    Este origen no tiene filtros de nivel de deuda disponibles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2 for Sysgal with nivel_deuda: Nivel de Deuda Filter (replaces tipo selection) */}
          {showNivelDeudaFilter && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-segal-dark">2. Selecciona el nivel de deuda</label>
              
              {loadingNivelDeuda ? (
                <div className="flex items-center gap-2 text-sm text-segal-dark/60 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando niveles de deuda...
                </div>
              ) : nivelDeudaValores.length === 0 ? (
                <div className="p-3 rounded bg-gray-50 text-sm text-gray-600">
                  No hay datos de nivel de deuda disponibles para este origen.
                </div>
              ) : (
                <div className="bg-white border border-segal-blue/20 rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-segal-blue" />
                      <span className="text-sm font-medium text-segal-dark">Nivel de deuda</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllNivelDeuda}
                      className="text-xs text-segal-blue hover:underline"
                    >
                      {selectedNivelDeuda.size === nivelDeudaValores.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  {/* Filter options */}
                  <div className="space-y-2">
                    {nivelDeudaValores.map((item) => {
                      const isSelected = selectedNivelDeuda.has(item.valor)
                      const label = NIVEL_DEUDA_LABELS[item.valor] || item.valor
                      const colorClass = NIVEL_DEUDA_COLORS[item.valor] || 'bg-gray-100 text-gray-600'

                      return (
                        <label
                          key={item.valor}
                          className={`
                            flex items-center justify-between p-2 rounded-lg border cursor-pointer
                            transition-all duration-150
                            ${isSelected ? 'border-segal-blue bg-segal-blue/5' : 'border-gray-200 hover:border-segal-blue/40'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleNivelDeuda(item.valor)}
                              className="border-segal-blue data-[state=checked]:bg-segal-blue"
                            />
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
                              {label}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-segal-dark">
                            {item.total.toLocaleString('es-CL')}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Help text */}
                  {selectedNivelDeuda.size === 0 && (
                    <p className="mt-3 text-xs text-segal-dark/50">
                      Selecciona uno o más niveles de deuda para filtrar los prospectos.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedOriginId && isFormComplete && selectedCount > 0 && (
            <div className="p-3 rounded bg-green-50 border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Se agregarán {selectedCount.toLocaleString()} prospectos
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {showNivelDeudaFilter 
                      ? `${selectedNivelDeuda.size} nivel(es) de deuda seleccionado(s)`
                      : isAllTypes 
                        ? 'Todos los tipos de prospecto'
                        : `Solo prospectos de tipo "${tiposProspecto?.find(t => t.id === selectedTipoId)?.nombre}"`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no selection (non-Sysgal with tipo selection) */}
          {selectedOriginId && !showNivelDeudaFilter && !sysgalWithoutNivelDeuda && !isStepTwoComplete && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Selecciona un tipo de prospecto o &quot;Todos&quot; para continuar
                </p>
              </div>
            </div>
          )}

          {/* Warning for Sysgal without nivel_deuda - need to select "all" */}
          {sysgalWithoutNivelDeuda && !isAllTypes && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Haz clic en &quot;Agregar todos los prospectos&quot; para continuar
                </p>
              </div>
            </div>
          )}

          {/* Warning for nivel deuda selection (Sysgal) */}
          {showNivelDeudaFilter && selectedNivelDeuda.size === 0 && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Selecciona al menos un nivel de deuda para continuar
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddProspects}
              disabled={!selectedOriginId || !isFormComplete || isLoading}
              className="flex-1 bg-segal-blue hover:bg-segal-blue/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Agregar Prospectos
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
