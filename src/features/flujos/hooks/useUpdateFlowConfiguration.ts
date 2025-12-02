/**
 * Hook para actualizar la configuración visual y estructura de un flujo
 * Usado en EditFlujoBuilder para guardar cambios en el flow builder
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing } from '@/types/flujo'

interface UpdateFlowConfigurationPayload {
  nombre?: string
  descripcion?: string
  activo?: boolean
  config_visual?: any
  config_structure?: any
}

export function useUpdateFlowConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ flujoId, payload }: { flujoId: number; payload: UpdateFlowConfigurationPayload }) =>
      flujosService.updateFlowConfiguration(flujoId, payload),

    onSuccess: (updatedFlujo: FlujoNurturing) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['flujos-detail', updatedFlujo.id] })
      queryClient.invalidateQueries({ queryKey: ['flujos'] })
    },

    onError: (error: any) => {
      console.error('Error al actualizar flujo:', error)
    },
  })
}
