/**
 * Create Flujo Dialog with Visual FlowBuilder
 * Replaces the old multi-step dialog with an integrated FlowBuilder experience
 * Steps: Origin -> Prospects -> FlowBuilder
 */

import { useState, useEffect } from 'react'
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
  tipoDeudor: string | null
  opciones?: OpcionesFlujos
  onSuccess?: () => void
}

export function CreateFlujoWithBuilder({
  open,
  onOpenChange,
  tipoDeudor,
  opciones,
  onSuccess,
}: CreateFlujoWithBuilderProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('origin')
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null)
  const [selectedOriginName, setSelectedOriginName] = useState<string | null>(null)
  const [selectedProspectoIds, setSelectedProspectoIds] = useState<Set<number>>(new Set())

  // Prospectos state
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loadingProspectos, setLoadingProspectos] = useState(false)

  // Form state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep('origin')
      setSelectedOriginId(null)
      setSelectedOriginName(null)
      setSelectedProspectoIds(new Set())
      setError(null)
    }
  }, [open])

  /**
   * Load prospects from selected origin
   */
  const handleOriginSelect = async (originId: string) => {
    setSelectedOriginId(originId)
    const origin = opciones?.origenes?.find((o) => o.id === originId)
    setSelectedOriginName(origin?.nombre || null)
    setLoadingProspectos(true)

    try {
      const response = await prospectosService.getAll({
        origen: originId,
        per_page: 1000,
      })
      setProspectos(response.data)
      setCurrentStep('prospects')
    } catch (err) {
      setError('Error al cargar prospectos. Intenta nuevamente.')
      console.error(err)
    } finally {
      setLoadingProspectos(false)
    }
  }

  /**
   * Move to builder after prospects selection
   */
  const handleProspectsSelect = () => {
    if (selectedProspectoIds.size === 0) {
      setError('Debes seleccionar al menos un prospecto')
      return
    }
    setError(null)
    setCurrentStep('builder')
  }

  /**
   * Go back to previous step
   */
  const handleBack = () => {
    if (currentStep === 'prospects') {
      setCurrentStep('origin')
    } else if (currentStep === 'builder') {
      setCurrentStep('prospects')
    }
  }

  /**
   * Save flow from builder
   */
  const handleSaveFlow = async (config: any) => {
    setSaving(true)
    try {
      const payload = {
        flujo: {
          nombre: config.flowName,
          descripcion: config.flowDescription,
          tipo_prospecto: tipoDeudor || config.tipoDeudor,
          activo: true,
        },
        origen_id: selectedOriginId,
        origen_nombre: selectedOriginName,
        prospectos: {
          total_seleccionados: selectedProspectoIds.size,
          ids_seleccionados: Array.from(selectedProspectoIds),
          total_disponibles: prospectos.length,
        },
        etapas: config.stages,
        metadata: {
          fecha_creacion: new Date().toISOString(),
          navegador: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      }

      await flujosService.createWithProspectos(payload)

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError('Error al crear el flujo. Intenta nuevamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

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
              loading={loadingProspectos}
              onClose={handleClose}
            />
          )}

          {currentStep === 'prospects' && (
            <ProspectSelector
              prospectos={prospectos}
              selectedIds={selectedProspectoIds}
              onSelectionChange={setSelectedProspectoIds}
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
