/**
 * Modal para agregar prospectos a un flujo existente
 * Permite seleccionar prospectos de un origen específico
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
import { AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react'
import { flujosService, type OrigenFlujo } from '@/api/flujos.service'
import { useFlujoOpciones } from '@/features/flujos/hooks/useFlujoOpciones'
import { useTiposProspecto } from '@/hooks/useTiposProspecto'
import { useProspectosConteoPorTipo } from '@/hooks/useProspectosConteoPorTipo'
import type { FlujoNurturing } from '@/types/flujo'

interface AddProspectsModalProps {
  flujo: FlujoNurturing | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddProspectsModal({
  flujo,
  isOpen,
  onClose,
  onSuccess,
}: AddProspectsModalProps) {
  // State
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null)
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null)
  const [isAllTypes, setIsAllTypes] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch options
  const { data: opciones } = useFlujoOpciones()
  const { data: tiposProspecto, isLoading: loadingTipos } = useTiposProspecto()
  
  // Fetch counts for selected origin
  const { data: conteoPorTipo, isLoading: loadingConteo } = useProspectosConteoPorTipo({
    origen: selectedOriginId || '',
    enabled: !!selectedOriginId,
  })

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

  const selectedCount = useMemo(() => {
    if (isAllTypes) return totalProspectosOrigen
    if (selectedTipoId) return conteoByTipoId[selectedTipoId] ?? 0
    return 0
  }, [isAllTypes, selectedTipoId, totalProspectosOrigen, conteoByTipoId])

  const getTodosTipoId = useCallback((): number | null => {
    if (!tiposProspecto || tiposProspecto.length === 0) return null
    const todosTipo = tiposProspecto.find((tipo) => tipo.nombre.toLowerCase() === 'todos')
    return todosTipo?.id ?? null
  }, [tiposProspecto])

  // Handlers
  const handleSelectOrigin = (originId: string) => {
    setSelectedOriginId(originId)
    setSelectedTipoId(null)
    setIsAllTypes(false)
  }

  const handleSelectAllTypes = () => {
    setIsAllTypes(true)
    setSelectedTipoId(getTodosTipoId())
  }

  const handleSelectTipo = (tipoId: number) => {
    setIsAllTypes(false)
    setSelectedTipoId(tipoId)
  }

  const handleAddProspects = async () => {
    if (!flujo?.id || !selectedOriginId) {
      toast.error('Error: Faltan datos requeridos')
      return
    }

    if (selectedCount === 0) {
      toast.error('Debes seleccionar prospectos para agregar')
      return
    }

    setIsLoading(true)
    try {
      const result = await flujosService.agregarProspectos(flujo.id, {
        origen: selectedOriginId,
        tipo_prospecto_id: selectedTipoId,
        select_all_from_origin: true,
        canal_asignado: 'email',
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensaje || error.message || 'Error al agregar prospectos'
      toast.error('Error', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOriginId(null)
      setSelectedTipoId(null)
      setIsAllTypes(false)
      onClose()
    }
  }

  if (!flujo) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Prospectos</DialogTitle>
          <DialogDescription>
            Selecciona el origen y tipo de prospectos para agregar al flujo "{flujo.nombre}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Origin */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-segal-dark">1. Selecciona el origen</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {opciones?.origenes?.map((origen: OrigenFlujo) => (
                <Button
                  key={origen.id}
                  variant={selectedOriginId === origen.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectOrigin(origen.id)}
                  className={selectedOriginId === origen.id 
                    ? 'bg-segal-blue text-white' 
                    : 'border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5'
                  }
                >
                  {origen.nombre}
                </Button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Type (only if origin selected) */}
          {selectedOriginId && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-segal-dark">2. Selecciona el tipo de deuda</label>
              
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

          {/* Summary */}
          {selectedOriginId && selectedCount > 0 && (
            <div className="p-3 rounded bg-green-50 border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Se agregarán {selectedCount.toLocaleString()} prospectos
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {isAllTypes 
                      ? 'Todos los tipos de deuda del origen seleccionado'
                      : `Solo prospectos de tipo "${tiposProspecto?.find(t => t.id === selectedTipoId)?.nombre}"`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no selection */}
          {selectedOriginId && selectedCount === 0 && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Selecciona un tipo de deuda o "Todos" para continuar
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
              disabled={!selectedOriginId || selectedCount === 0 || isLoading}
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
