/**
 * Create Flujo Dialog with Visual FlowBuilder
 * Replaces the old multi-step dialog with an integrated FlowBuilder experience
 * Steps: Origin -> Prospects -> FlowBuilder
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import type { OpcionesFlujos } from '@/api/flujos.service'
import type { Prospecto } from '@/types/prospecto'
import { FlowBuilder } from '../FlowBuilder/FlowBuilder'
import { OriginSelector } from './steps/OriginSelector'
import { ProspectSelector } from './steps/ProspectSelector'
import { prospectosService } from '@/api/prospectos.service'
import { flujosService } from '@/api/flujos.service'

type Step = 'origin' | 'prospects' | 'builder'

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

  // Prospectos disponibles
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loadingProspectos, setLoadingProspectos] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtiene el nombre de un origen por su ID
   */
  const getOriginNameById = useCallback(
    (originId: string): string | null => {
      return opciones?.origenes?.find((o) => o.id === originId)?.nombre ?? null
    },
    [opciones?.origenes]
  )

  /**
   * Carga prospectos del origen seleccionado
   * Early return si hay error de carga
   */
  const handleOriginSelect = useCallback(
    async (originId: string) => {
      setSelectedOriginId(originId)
      setSelectedOriginName(getOriginNameById(originId))
      setLoadingProspectos(true)
      setError(null)

      try {
        const response = await prospectosService.getAll({
          origen: originId,
          per_page: 1000,
        })
        setProspectos(response.data)
        setCurrentStep('prospects')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        setError(`Error al cargar prospectos: ${errorMessage}`)
        console.error('❌ Error cargando prospectos:', { originId, error })
      } finally {
        setLoadingProspectos(false)
      }
    },
    [getOriginNameById]
  )

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
    setError(null)

    // Si hay origen inicial, lo carga automáticamente
    if (initialOriginId) {
      handleOriginSelect(initialOriginId)
    }
  }, [open, initialOriginId, handleOriginSelect])

  /**
   * Valida y avanza a step de builder
   * Usa early returns para validaciones
   */
  const handleProspectsSelect = () => {
    // Validación 1: Mínimo un prospecto
    if (selectedProspectoIds.size === 0) {
      setError('Debes seleccionar al menos un prospecto')
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
   * Retrocede al paso anterior
   */
  const handleBack = () => {
    if (currentStep === 'prospects') {
      setCurrentStep('origin')
      return
    }

    if (currentStep === 'builder') {
      setCurrentStep('prospects')
      return
    }
  }

  /**
   * Construye payload para crear flujo en backend
   * IMPORTANTE: El backend espera 'tipo_prospecto' (no 'tipo_prospecto_id')
   * y acepta tanto ID numérico como nombre string
   */
  const buildFlowPayload = (config: any) => {
    return {
      flujo: {
        nombre: config.nombre,
        descripcion: config.descripcion,
        // Backend busca por ID, nombre o slug - enviar el ID es lo más confiable
        tipo_prospecto: selectedTipoProspectoId,
        activo: true,
      },
      origen_id: selectedOriginId,
      origen_nombre: selectedOriginName,
      prospectos: {
        total_seleccionados: selectedProspectoIds.size,
        ids_seleccionados: Array.from(selectedProspectoIds),
        total_disponibles: prospectos.length,
        tipo_prospecto_id: selectedTipoProspectoId,
      },
      visual: config.visual,
      structure: config.structure,
      stages: config.stages,
      metadata: {
        fecha_creacion: new Date().toISOString(),
        navegador: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    }
  }

  /**
   * Guarda flujo en backend
   * Manejo robusto de errores con logs detallados
   */
  const handleSaveFlow = async (config: any) => {
    setSaving(true)
    setError(null)

    try {
      const payload = buildFlowPayload(config)

      console.log('📤 Enviando payload a backend:', JSON.stringify(payload, null, 2))

      const createdFlow = await flujosService.createWithProspectos(payload)

      // Guardar la configuración visual y estructura
      // Esto asegura que el nodo inicial y otros datos se guarden correctamente
      if (createdFlow && createdFlow.id && config.visual && config.structure) {
        try {
          await flujosService.updateFlowConfiguration(createdFlow.id, {
            config_visual: config.visual,
            config_structure: config.structure,
          })
          console.log('✅ Configuración visual y estructura guardadas correctamente')
        } catch (err) {
          console.warn('⚠️ Error al guardar la configuración visual, pero el flujo fue creado:', err)
          // No lanzar error aquí - el flujo ya se creó
        }
      }

      console.log('✅ Flujo creado exitosamente')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al crear el flujo: ${errorMessage}`)
      console.error('❌ Error creando flujo:', { payload: buildFlowPayload(config), error })
    } finally {
      setSaving(false)
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
              </DialogTitle>
              <DialogDescription className="text-segal-dark/70 mt-1">
                {currentStep === 'origin' &&
                  'Selecciona el origen de datos para obtener los prospectos'}
                {currentStep === 'prospects' &&
                  `${selectedOriginName} - Elige qué prospectos incluir en el flujo`}
                {currentStep === 'builder' &&
                  'Diseña visualmente tu flujo de nurturing con etapas y conexiones'}
              </DialogDescription>
            </div>

            {currentStep !== 'origin' && (
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
          {currentStep === 'origin' && !initialOriginId && (
            <OriginSelector
              opciones={opciones}
              onSelect={handleOriginSelect}
              loading={loadingProspectos}
              onClose={handleClose}
            />
          )}

          {currentStep === 'prospects' && (
            <ProspectSelector
              prospectos={prospectos}
              selectedIds={selectedProspectoIds}
              onSelectionChange={setSelectedProspectoIds}
              onTipoChange={setSelectedTipoProspectoId}
              onContinue={handleProspectsSelect}
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
              selectedProspectoCount={selectedProspectoIds.size}
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
