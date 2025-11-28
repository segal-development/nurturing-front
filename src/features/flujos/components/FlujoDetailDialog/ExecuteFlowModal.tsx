/**
 * Modal para ejecutar un flujo de nurturing
 * Permite seleccionar prospectos y fecha de inicio (opcional)
 */

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'
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
  const queryClient = useQueryClient()

  if (!flujo) {
    return null
  }

  const handleExecute = async () => {
    if (prospectoIds.length === 0) {
      toast.error('Selecciona al menos un prospecto')
      return
    }

    setIsLoading(true)
    try {
      const result = await flujosService.ejecutarFlujo(flujo.id, {
        prospectos_ids: prospectoIds,
        ...(fechaInicio && { fecha_inicio_programada: fechaInicio }),
      })

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
            Selecciona los prospectos y la fecha de inicio para ejecutar este flujo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de prospectos */}
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
              disabled={prospectoIds.length === 0 || isLoading}
              className="flex-1 bg-segal-green hover:bg-segal-green/90"
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
