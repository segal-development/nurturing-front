/**
 * Modal simplificado para ejecutar un flujo de nurturing
 * Solo muestra confirmación, sin opciones de modificar prospectos o fecha
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, DollarSign, Info, Loader2 } from 'lucide-react'
import { flujosService } from '@/api/flujos.service'
import { useActiveExecution } from '@/features/flujos/hooks/useFlowExecutionTracking'
import { formatCurrency, useCostoEstimado } from '@/features/costos/hooks'
import type { FlujoNurturing } from '@/types/flujo'

interface ExecuteFlowModalProps {
  flujo: FlujoNurturing | null
  isOpen: boolean
  onClose: () => void
  onExecuteSuccess?: (ejecucionId: number) => void
}

export function ExecuteFlowModal({
  flujo,
  isOpen,
  onClose,
  onExecuteSuccess,
}: ExecuteFlowModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prospectoCount, setProspectoCount] = useState(0)
  const queryClient = useQueryClient()

  // Verificar si hay una ejecución activa
  const { data: activeExecutionData } = useActiveExecution(flujo?.id || 0, isOpen && !!flujo?.id)
  const hasActiveExecution = activeExecutionData?.tiene_ejecucion_activa || false
  const activeExecution = activeExecutionData?.ejecucion || null

  // Get estimated cost
  const { data: costoEstimado, isLoading: isLoadingCosto } = useCostoEstimado(
    flujo?.id || null,
    prospectoCount
  )

  // Contar prospectos del flujo al abrir
  useEffect(() => {
    if (isOpen && flujo) {
      const count = flujo.prospectos_en_flujo?.length || 0
      setProspectoCount(count)
    }
  }, [isOpen, flujo])

  if (!flujo) {
    return null
  }

  const handleExecute = async () => {
    if (prospectoCount === 0) {
      toast.error('El flujo no tiene prospectos configurados', {
        description: 'Edita el flujo y agrega prospectos antes de ejecutarlo',
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('========== EJECUTANDO FLUJO ==========')
      console.log('📋 Flujo completo:', flujo)
      console.log('🔧 Config Structure:', flujo.config_structure)
      console.log('📊 Stages:', flujo.config_structure?.stages)
      console.log('🔗 Branches:', flujo.config_structure?.branches)

      const prospectoIds = flujo.prospectos_en_flujo?.map((pf) => pf.prospecto_id) || []

      const payload: any = {
        prospectos_ids: prospectoIds,
      }

      // Agregar origen_id si está disponible
      if (flujo.origen_id) {
        payload.origen_id = flujo.origen_id
      }

      console.log('📤 Payload que se enviará:', payload)
      console.log('🎯 Flujo ID:', flujo.id)
      console.log('======================================')

      const result = await flujosService.ejecutarFlujo(flujo.id, payload)

      toast.success(`Flujo iniciado correctamente`, {
        description: `Ejecución #${result.ejecucion_id} • ${prospectoCount} prospecto${prospectoCount !== 1 ? 's' : ''}`,
      })

      // Llamar callback con el ejecucion_id
      onExecuteSuccess?.(result.ejecucion_id)

      onClose()

      // Invalidate cache to refresh flow list
      queryClient.invalidateQueries({ queryKey: ['flujos-page'] })
      queryClient.invalidateQueries({ queryKey: ['flowExecutionActive'] })
    } catch (error: any) {
      console.error('❌ [ExecuteFlowModal] Error completo:', error)
      console.error('❌ [ExecuteFlowModal] Response data:', error.response?.data)

      // Extraer mensaje de error detallado
      const errorData = error.response?.data
      const errorMessage =
        errorData?.mensaje || errorData?.message || error.message || 'Error al ejecutar el flujo'
      const errorDetail = errorData?.detalle || errorData?.detail || ''

      // Mostrar toast con información completa
      toast.error('Error al ejecutar el flujo', {
        description: errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage,
        duration: 10000, // 10 segundos para poder leer el error
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ejecutar: {flujo.nombre}</DialogTitle>
          <DialogDescription>Se ejecutará con los prospectos configurados en el flujo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia si hay una ejecución activa */}
          {hasActiveExecution && activeExecution && (
            <div className="p-3 rounded bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Ejecución Activa en Progreso</p>
                  <p className="text-xs text-red-700 mt-1">
                    Este flujo ya tiene una ejecución en progreso. No puedes iniciar una nueva
                    ejecución hasta que la actual finalice o sea cancelada.
                  </p>
                  {activeExecution.proximo_nodo && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Próximo nodo: {activeExecution.proximo_nodo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advertencia si no hay origen */}
          {!flujo.origen_id && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Origen no configurado</p>
                  <p className="text-xs text-amber-700 mt-1">
                    El flujo necesita un origen configurado para ejecutarse
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Advertencia si no hay prospectos */}
          {prospectoCount === 0 && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Sin prospectos configurados</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Debes agregar prospectos al flujo antes de ejecutarlo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información de prospectos configurados */}
          {prospectoCount > 0 && (
            <div className="p-3 rounded bg-green-50 border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">
                    ✓ {prospectoCount} prospecto{prospectoCount !== 1 ? 's' : ''} configurado
                    {prospectoCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Se ejecutará el flujo con los prospectos que configuraste al crear el flujo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Costo Estimado */}
          {prospectoCount > 0 && (
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900">Costo Estimado</p>
                  {isLoadingCosto ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                      <span className="text-xs text-emerald-700">Calculando...</span>
                    </div>
                  ) : costoEstimado ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-lg font-bold text-emerald-800">
                        {formatCurrency(costoEstimado.resumen.costo_total)}
                      </p>
                      <div className="text-xs text-emerald-700 space-y-0.5">
                        {costoEstimado.resumen.total_etapas_email > 0 && (
                          <p>
                            📧 {costoEstimado.resumen.total_etapas_email} etapa(s) email × {prospectoCount} prospectos = {formatCurrency(costoEstimado.resumen.costo_emails)}
                          </p>
                        )}
                        {costoEstimado.resumen.total_etapas_sms > 0 && (
                          <p>
                            📱 {costoEstimado.resumen.total_etapas_sms} etapa(s) SMS × {prospectoCount} prospectos = {formatCurrency(costoEstimado.resumen.costo_sms)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 mt-1">
                      No se pudo calcular el costo
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información sobre el flujo */}
          <div className="p-3 rounded bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-900 mb-1">ℹ️ Información del flujo:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• El flujo se ejecutará de manera automática según los tiempos configurados</li>
                  <li>• Las condiciones se verificarán según los horarios establecidos</li>
                  <li>• Puedes monitorear el progreso en la pestaña "Ejecuciones"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleExecute}
              disabled={prospectoCount === 0 || isLoading || !flujo.origen_id || hasActiveExecution}
              className="flex-1 bg-segal-green hover:bg-segal-green/90 disabled:opacity-50"
              title={
                hasActiveExecution
                  ? 'Ya existe una ejecución activa para este flujo'
                  : !flujo.origen_id
                    ? 'El flujo necesita un origen configurado'
                    : prospectoCount === 0
                      ? 'El flujo necesita prospectos configurados'
                      : 'Ejecutar el flujo con los prospectos configurados'
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : hasActiveExecution ? (
                <>🚫 Ejecución Activa</>
              ) : (
                <>▶ Ejecutar Flujo</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
