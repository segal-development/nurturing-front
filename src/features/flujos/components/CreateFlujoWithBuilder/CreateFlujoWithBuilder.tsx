/**
 * Create Flujo Dialog with Visual FlowBuilder
 * Replaces the old multi-step dialog with an integrated FlowBuilder experience
 * Steps: Origin -> Prospects -> FlowBuilder
 */

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertCircle, ChevronLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OpcionesFlujos } from '@/api/flujos.service'
import type { Prospecto } from '@/types/prospecto'
import { FlowBuilder } from '../FlowBuilder/FlowBuilder'
import { OriginSelector } from './steps/OriginSelector'
import { ProspectSelector } from './steps/ProspectSelector'
import { FlujoProcesamientoIndicator } from '../FlujoProcesamientoIndicator'
import { useFlujoProcesamiento } from '../../hooks/useFlujoProcesamiento'
import { prospectosService } from '@/api/prospectos.service'
import { flujosService } from '@/api/flujos.service'

type Step = 'origin' | 'prospects' | 'builder' | 'processing'

// =============================================================================
// SUB-COMPONENTE: ProcessingStep
// =============================================================================

interface ProcessingStepProps {
  flujoNombre: string
  estadoProcesamiento: string | null
  onClose: () => void
}

function ProcessingStep({ flujoNombre, estadoProcesamiento, onClose }: ProcessingStepProps) {
  // Keep completed state locally so it doesn't reset when store cleans up
  const [wasCompleted, setWasCompleted] = useState(false)

  useEffect(() => {
    if (estadoProcesamiento === 'completado') {
      setWasCompleted(true)
    }
  }, [estadoProcesamiento])

  // Once completed, stay completed (even if store resets to null)
  const isCompleted = wasCompleted || estadoProcesamiento === 'completado'

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Título */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-segal-blue/10 mb-4">
            {isCompleted ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Loader2 className="h-8 w-8 text-segal-blue animate-spin" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-segal-dark">
            {isCompleted ? '¡Flujo Creado!' : 'Creando Flujo'}
          </h3>
          <p className="text-segal-dark/70">
            {isCompleted
              ? `El flujo "${flujoNombre}" está listo para usar.`
              : `Asignando prospectos a "${flujoNombre}"...`}
          </p>
        </div>

        {/* Indicador de progreso */}
        <FlujoProcesamientoIndicator variant="inline" />

        {/* Nota informativa */}
        {!isCompleted && (
          <div className="text-center text-sm text-segal-dark/60 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p>
              Puedes cerrar este modal. El procesamiento continuará en segundo plano
              y recibirás una notificación cuando termine.
            </p>
          </div>
        )}

        {/* Botón de cerrar */}
        <div className="flex justify-center">
          <Button
            variant={isCompleted ? 'default' : 'outline'}
            onClick={onClose}
            className="min-w-32"
          >
            {isCompleted ? 'Cerrar' : 'Cerrar y continuar en segundo plano'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface CreateFlujoWithBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opciones?: OpcionesFlujos
  onSuccess?: () => void
  initialOriginId?: string | null
}

export function CreateFlujoWithBuilder({
  open,
  onOpenChange,
  opciones,
  onSuccess,
  initialOriginId,
}: CreateFlujoWithBuilderProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('origin')

  // Origen seleccionado
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null)
  const [selectedOriginName, setSelectedOriginName] = useState<string | null>(null)

  // Prospectos seleccionados
  const [selectedProspectoIds, setSelectedProspectoIds] = useState<Set<number>>(new Set())
  const [selectedTipoProspectoId, setSelectedTipoProspectoId] = useState<number | null>(null)
  const [selectAllFromOrigin, setSelectAllFromOrigin] = useState(false)
  const [selectedCount, setSelectedCount] = useState<number>(0) // Actual count to use

  // Prospectos disponibles
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [totalProspectosEnBD, setTotalProspectosEnBD] = useState<number>(0)
  const [loadingProspectos, setLoadingProspectos] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado para flujo creado (usado en step processing)
  const [flujoCreado, setFlujoCreado] = useState<{ id: number; nombre: string } | null>(null)

  // Hook de procesamiento async
  const { estado: estadoProcesamiento, iniciarTracking, detenerTracking } = useFlujoProcesamiento({
    onComplete: () => {
      // IMPORTANTE: Primero notificar (invalida cache) y LUEGO cerrar modal
      // Si cerramos primero, el componente se desmonta y el callback puede perderse
      onSuccess?.()
      onOpenChange(false)
    },
  })

  /**
   * Reset all state when modal closes
   * This ensures a clean slate when opening the modal again
   */
  useEffect(() => {
    if (!open) {
      // Reset to initial state
      setCurrentStep('origin')
      setSelectedOriginId(null)
      setSelectedOriginName(null)
      setSelectedProspectoIds(new Set())
      setSelectedTipoProspectoId(null)
      setSelectAllFromOrigin(false)
      setSelectedCount(0)
      setProspectos([])
      setTotalProspectosEnBD(0)
      setLoadingProspectos(false)
      setSaving(false)
      setError(null)
      setFlujoCreado(null)
      // Stop any ongoing polling from previous flujo
      detenerTracking()
    }
  }, [open, detenerTracking])

  /**
   * Obtiene el nombre de un origen por su ID
   */
  const getOriginNameById = (originId: string): string | null => {
    return opciones?.origenes?.find((o) => o.id === originId)?.nombre ?? null
  }

  /**
   * Carga prospectos del origen seleccionado
   * Early return si hay error de carga
   */
  const handleOriginSelect = async (originId: string) => {
      setSelectedOriginId(originId)
      setSelectedOriginName(getOriginNameById(originId))
      setLoadingProspectos(true)
      setError(null)

      try {
        // Cargar el conteo total primero (sin datos)
        const totalCount = await prospectosService.getCount({
          origen: originId,
        })
        setTotalProspectosEnBD(totalCount)

        // Cargar solo los primeros 100 para preview
        const response = await prospectosService.getAll({
          origen: originId,
          per_page: 100,
        })
        setProspectos(response.data)
        setCurrentStep('prospects')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        setError(`Error al cargar prospectos: ${errorMessage}`)
        logger.error('Error cargando prospectos:', { originId, error })
      } finally {
        setLoadingProspectos(false)
      }
  }

  /**
   * Maneja la apertura del diálogo y carga origen inicial si existe
   */
  useEffect(() => {
    if (!open) return

    // Reset state when dialog opens
    setCurrentStep('origin')
    setSelectedOriginId(null)
    setSelectedOriginName(null)
    setSelectedProspectoIds(new Set())
    setSelectedTipoProspectoId(null)
    setSelectAllFromOrigin(false)
    setSelectedCount(0)
    setError(null)
    setFlujoCreado(null)

    // Si hay origen inicial, lo carga automáticamente
    if (initialOriginId) {
      handleOriginSelect(initialOriginId)
    }
  }, [open, initialOriginId, handleOriginSelect])

  /**
   * Valida y avanza a step de builder CON prospectos
   * Usa early returns para validaciones
   */
  const handleProspectsSelect = () => {
    // Validación 1: Mínimo un prospecto o seleccionar todos
    if (selectedProspectoIds.size === 0 && !selectAllFromOrigin) {
      setError('Debes seleccionar al menos un prospecto o usar "Seleccionar Todos del Origen"')
      return
    }

    // Validación 2: Tipo prospecto obligatorio
    if (selectedTipoProspectoId === null) {
      setError('Debes seleccionar un tipo de prospecto')
      return
    }

    // Validaciones pasadas
    setError(null)
    setCurrentStep('builder')
  }

  /**
   * Avanza a step de builder SIN prospectos (flujo vacío/template)
   * Los prospectos se agregarán después desde el detalle del flujo
   */
  const handleContinueWithoutProspects = () => {
    // Clear any prospect selection
    setSelectedProspectoIds(new Set())
    setSelectAllFromOrigin(false)
    setSelectedCount(0)
    // Don't require tipo_prospecto for empty flows
    setError(null)
    setCurrentStep('builder')
  }

  /**
   * Salta directamente al builder desde el origin selector (flujo completamente vacío)
   * No tiene origen ni prospectos - es un template puro
   */
  const handleSkipToBuilder = () => {
    // Clear all selection state
    setSelectedOriginId(null)
    setSelectedOriginName(null)
    setProspectos([])
    setTotalProspectosEnBD(0)
    setSelectedProspectoIds(new Set())
    setSelectedTipoProspectoId(null)
    setSelectAllFromOrigin(false)
    setSelectedCount(0)
    setError(null)
    setCurrentStep('builder')
  }

  /**
   * Retrocede al paso anterior
   * Limpia el estado relacionado para permitir re-selección
   */
  const handleBack = () => {
    if (currentStep === 'prospects') {
      // Limpiar estado de origen para mostrar el selector
      setSelectedOriginId(null)
      setSelectedOriginName(null)
      setProspectos([])
      setTotalProspectosEnBD(0)
      setSelectedProspectoIds(new Set())
      setSelectedTipoProspectoId(null)
      setSelectAllFromOrigin(false)
      setSelectedCount(0)
      setCurrentStep('origin')
      return
    }

    if (currentStep === 'builder') {
      // If we came from origin (skipped prospects), go back to origin
      // If we came from prospects, go back to prospects
      if (selectedOriginId) {
        setCurrentStep('prospects')
      } else {
        setCurrentStep('origin')
      }
      return
    }
  }

  /**
   * Construye payload para crear flujo en backend
   * IMPORTANTE: El backend espera 'tipo_prospecto' (no 'tipo_prospecto_id')
   * y acepta tanto ID numérico como nombre string
   * 
   * Soporta flujos con y sin prospectos (templates/vacíos)
   */
  const buildFlowPayload = (config: any) => {
    const hasProspects = selectedCount > 0 || selectedProspectoIds.size > 0 || selectAllFromOrigin

    return {
      flujo: {
        nombre: config.nombre,
        descripcion: config.descripcion,
        // Backend busca por ID, nombre o slug - enviar el ID si existe
        tipo_prospecto: selectedTipoProspectoId,
        activo: true,
      },
      origen_id: selectedOriginId,
      origen_nombre: selectedOriginName,
      // Only include prospectos if user selected some
      prospectos: hasProspects ? {
        // Use selectedCount which reflects the actual count (all types OR specific tipo)
        total_seleccionados: selectedCount || selectedProspectoIds.size,
        ids_seleccionados: selectAllFromOrigin ? [] : Array.from(selectedProspectoIds),
        total_disponibles: totalProspectosEnBD,
        tipo_prospecto_id: selectedTipoProspectoId,
        select_all_from_origin: selectAllFromOrigin,
      } : {
        // Empty flow - no prospects yet
        total_seleccionados: 0,
        ids_seleccionados: [],
        total_disponibles: totalProspectosEnBD,
        tipo_prospecto_id: null,
        select_all_from_origin: false,
      },
      visual: config.visual,
      structure: config.structure,
      stages: config.stages,
      metadata: {
        fecha_creacion: new Date().toISOString(),
        navegador: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        created_without_prospects: !hasProspects,
      },
    }
  }

  /**
   * Guarda flujo en backend
   * Manejo robusto de errores y soporte para procesamiento async
   */
  const handleSaveFlow = async (config: any) => {
    // Validación crítica: tipo de prospecto es obligatorio
    if (!selectedTipoProspectoId) {
      setError('Error: No se ha seleccionado un tipo de prospecto. Por favor vuelve al paso anterior.')
      logger.error('selectedTipoProspectoId is null/undefined')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = buildFlowPayload(config)
      // Use selectedCount which reflects the actual count (all types OR specific tipo)
      const totalProspectos = selectedCount || selectedProspectoIds.size

      logger.log('Enviando payload a backend:', JSON.stringify(payload, null, 2))

      // Usar el nuevo método que retorna info de procesamiento async
      const response = await flujosService.createWithProspectosAsync(payload)

      // Guardar la configuración visual y estructura
      await guardarConfiguracionVisual(response.data.id, config)

      // ¿El backend está procesando en background?
      const isAsync = response.resumen?.procesamiento_async ?? false

      if (isAsync) {
        // Procesamiento async: mostrar indicador de progreso
        logger.log('Procesamiento async iniciado para flujo:', response.data.id)

        setFlujoCreado({ id: response.data.id, nombre: response.data.nombre || config.nombre })
        setCurrentStep('processing')

        // Iniciar tracking del progreso
        iniciarTracking(
          response.data.id,
          response.data.nombre || config.nombre,
          totalProspectos
        )
      } else {
        // Procesamiento síncrono: cerrar y notificar
        logger.log('Flujo creado exitosamente (síncrono)')
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al crear el flujo: ${errorMessage}`)
      logger.error('Error creando flujo:', error)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Guarda la configuración visual del flujo (separado para claridad)
   */
  const guardarConfiguracionVisual = async (flujoId: number, config: any): Promise<void> => {
    if (!config.visual || !config.structure) return

    try {
      await flujosService.updateFlowConfiguration(flujoId, {
        config_visual: config.visual,
        config_structure: config.structure,
      })
      logger.log('Configuración visual guardada')
    } catch (err) {
      // No es crítico, el flujo ya se creó
      logger.warn('Error al guardar configuración visual:', err)
    }
  }

  /**
   * Cierra el modal
   */
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] h-[90vh] bg-white border border-segal-blue/20 shadow-2xl p-0">
        {/* Header */}
        <DialogHeader className="border-b border-segal-blue/10 px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-segal-dark">
                {currentStep === 'origin' && 'Crear Nuevo Flujo'}
                {currentStep === 'prospects' && 'Selecciona Prospectos'}
                {currentStep === 'builder' && 'Constructor de Flujos'}
                {currentStep === 'processing' && 'Procesando Flujo'}
              </DialogTitle>
              <DialogDescription className="text-segal-dark/70 mt-1">
                {currentStep === 'origin' &&
                  'Selecciona el origen de datos para obtener los prospectos'}
                {currentStep === 'prospects' &&
                  `${selectedOriginName} - Elige qué prospectos incluir en el flujo`}
                {currentStep === 'builder' &&
                  'Diseña visualmente tu flujo de nurturing con etapas y conexiones'}
                {currentStep === 'processing' &&
                  'Los prospectos se están asignando al flujo en segundo plano'}
              </DialogDescription>
            </div>

            {currentStep !== 'origin' && currentStep !== 'processing' && (
              <button
                type="button"
                onClick={handleBack}
                className="p-2 hover:bg-segal-blue/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-segal-blue" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Error message */}
        {error && (
          <div className="border-b border-segal-red/20 bg-segal-red/10 px-6 py-3 flex gap-3">
            <AlertCircle className="h-5 w-5 text-segal-red shrink-0 mt-0.5" />
            <p className="text-sm text-segal-red">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'origin' && (
            <OriginSelector
              opciones={opciones}
              onSelect={handleOriginSelect}
              onSkipToBuilder={handleSkipToBuilder}
              loading={loadingProspectos}
              onClose={handleClose}
            />
          )}

          {currentStep === 'prospects' && (
            <ProspectSelector
              prospectos={prospectos}
              totalEnBD={totalProspectosEnBD}
              selectedIds={selectedProspectoIds}
              selectAllFromOrigin={selectAllFromOrigin}
              onSelectionChange={setSelectedProspectoIds}
              onSelectAllFromOriginChange={setSelectAllFromOrigin}
              onTipoChange={setSelectedTipoProspectoId}
              onSelectedCountChange={setSelectedCount}
              onContinue={handleProspectsSelect}
              onContinueWithoutProspects={handleContinueWithoutProspects}
              originId={selectedOriginId || ''}
              originName={selectedOriginName || ''}
              onBack={handleBack}
              onClose={handleClose}
            />
          )}

          {currentStep === 'builder' && (
            <FlowBuilder
              onSaveFlow={handleSaveFlow}
              onCancel={handleBack}
              initialName=""
              initialDescription=""
              selectedOriginId={selectedOriginId || ''}
              selectedOriginName={selectedOriginName || ''}
              selectedProspectoCount={selectedCount || selectedProspectoIds.size}
            />
          )}

          {currentStep === 'processing' && (
            <ProcessingStep
              flujoNombre={flujoCreado?.nombre || ''}
              estadoProcesamiento={estadoProcesamiento}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Loading overlay */}
        {saving && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
              <p className="text-segal-dark font-semibold">Creando flujo...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
