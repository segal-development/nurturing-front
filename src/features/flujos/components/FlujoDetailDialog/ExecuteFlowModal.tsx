/**
 * Modal para ejecutar un flujo de nurturing
 * Pre-carga los prospectos del flujo, permite modificarlos y establecer fecha de inicio
 */

import { useState, useEffect } from 'react'
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
import { Loader2, Info } from 'lucide-react'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing } from '@/types/flujo'
import { ProspectoMultiSelect } from '../ProspectoMultiSelect'

interface ExecuteFlowModalProps {
  flujo: FlujoNurturing | null
  isOpen: boolean
  onClose: () => void
}

export function ExecuteFlowModal({ flujo, isOpen, onClose }: ExecuteFlowModalProps) {
  const [prospectoIds, setProspectoIds] = useState<number[]>([])
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModifyOptions, setShowModifyOptions] = useState(false)
  const queryClient = useQueryClient()

  // Pre-cargar prospectos del flujo al abrir
  useEffect(() => {
    if (isOpen && flujo) {
      const prospectos = flujo.prospectos_en_flujo?.map((pf) => pf.prospecto_id) || []
      setProspectoIds(prospectos)
      setShowModifyOptions(prospectos.length === 0) // Mostrar opciones si no hay prospectos
    }
  }, [isOpen, flujo])

  if (!flujo) {
    return null
  }

  const handleExecute = async () => {
    if (prospectoIds.length === 0) {
      toast.error('Selecciona al menos un prospecto')
      return
    }

    // Validar fecha si se proporciona
    if (fechaInicio) {
      const fechaElegida = new Date(fechaInicio)
      const ahora = new Date()

      if (fechaElegida < ahora) {
        toast.error('La fecha debe ser posterior a la fecha actual')
        return
      }
    }

    setIsLoading(true)
    try {
      const payload: any = {
        prospectos_ids: prospectoIds,
      }

      // Agregar origen_id si está disponible
      if (flujo.origen_id) {
        payload.origen_id = flujo.origen_id
      }

      // Agregar fecha solo si es válida
      if (fechaInicio) {
        payload.fecha_inicio_programada = new Date(fechaInicio).toISOString()
      }

      const result = await flujosService.ejecutarFlujo(flujo.id, payload)

      toast.success(`Flujo iniciado: ${result.id}`, {
        description: fechaInicio
          ? `Se ejecutará a partir del ${new Date(fechaInicio).toLocaleDateString()}`
          : 'Se ejecutará inmediatamente',
      })

      // Reset form
      setProspectoIds([])
      setFechaInicio('')
      onClose()

      // Invalidate cache to refresh flow list
      queryClient.invalidateQueries({ queryKey: ['flujos-page'] })
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al ejecutar el flujo'
      toast.error('Error al ejecutar el flujo', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setProspectoIds([])
      setFechaInicio('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ejecutar: {flujo.nombre}</DialogTitle>
          <DialogDescription>
            {showModifyOptions
              ? 'Modifica los prospectos si es necesario'
              : 'Se ejecutará con los prospectos configurados en el flujo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia si no hay origen */}
          {!flujo.origen_id && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200">
              <p className="text-xs font-medium text-amber-900">
                ⚠️ Origen no configurado
              </p>
              <p className="text-xs text-amber-700 mt-1">
                El flujo necesita un origen configurado para ejecutarse
              </p>
            </div>
          )}

          {/* Información de prospectos configurados */}
          {prospectoIds.length > 0 && !showModifyOptions && (
            <div className="p-3 rounded bg-segal-green/5 border border-segal-green/20">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-segal-green mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-segal-green/90">
                    ✓ {prospectoIds.length} prospecto{prospectoIds.length !== 1 ? 's' : ''} configurado{
                      prospectoIds.length !== 1 ? 's' : ''
                    }
                  </p>
                  <p className="text-xs text-segal-green/70 mt-1">
                    Se ejecutará el flujo con los prospectos que configuraste al crear el flujo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selector de prospectos - mostrar si no hay configurados o si se elige modificar */}
          {showModifyOptions && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-segal-dark">Seleccionar prospectos:</label>
              <ProspectoMultiSelect
                origenId={flujo.origen_id}
                value={prospectoIds}
                onChange={setProspectoIds}
              />
              <p className="text-xs text-segal-dark/60">
                {prospectoIds.length} prospecto{prospectoIds.length !== 1 ? 's' : ''} seleccionado{
                  prospectoIds.length !== 1 ? 's' : ''
                }
              </p>
            </div>
          )}

          {/* Botón para modificar prospectos */}
          {prospectoIds.length > 0 && !showModifyOptions && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModifyOptions(true)}
              className="w-full text-segal-blue border-segal-blue/20 hover:bg-segal-blue/5"
            >
              Modificar prospectos
            </Button>
          )}

          {/* Botón para cancelar modificaciones */}
          {showModifyOptions && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const prospectos = flujo.prospectos_en_flujo?.map((pf) => pf.prospecto_id) || []
                setProspectoIds(prospectos)
                setShowModifyOptions(false)
              }}
              disabled={isLoading}
              className="w-full text-segal-dark/60 border-segal-dark/20"
            >
              Cancelar cambios
            </Button>
          )}

          {/* Fecha de inicio (opcional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-segal-dark">Fecha de inicio (opcional):</label>
            <input
              type="datetime-local"
              value={fechaInicio || ''}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 disabled:opacity-50"
            />
            <p className="text-xs text-segal-dark/60">
              {fechaInicio
                ? `Se ejecutará a partir del ${new Date(fechaInicio).toLocaleDateString()}`
                : 'Si no especificas fecha, se ejecutará inmediatamente'}
            </p>
          </div>

          {/* Información sobre etapas */}
          <div className="p-3 rounded bg-segal-blue/5 border border-segal-blue/10">
            <p className="text-xs font-medium text-segal-blue mb-2">ℹ️ Información del flujo:</p>
            <ul className="text-xs text-segal-dark/70 space-y-1">
              <li>• El flujo se ejecutará de manera automática según los tiempos configurados</li>
              <li>• Las condiciones se verificarán según los horarios establecidos</li>
              <li>• Puedes monitorear el progreso en la pestaña "Ejecuciones"</li>
            </ul>
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
              disabled={prospectoIds.length === 0 || isLoading || !flujo.origen_id}
              className="flex-1 bg-segal-green hover:bg-segal-green/90 disabled:opacity-50"
              title={!flujo.origen_id ? 'El flujo necesita un origen configurado' : ''}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
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
