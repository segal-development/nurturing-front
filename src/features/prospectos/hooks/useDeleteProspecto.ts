/**
 * Hook para eliminar un prospecto
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { prospectosService } from '@/api/prospectos.service'
import { toast } from 'sonner'

export function useDeleteProspecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => prospectosService.delete(id),
    onSuccess: () => {
      toast.success('Prospecto eliminado correctamente')
      // Invalidar queries para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['prospectos'] })
      queryClient.invalidateQueries({ queryKey: ['prospectos-opciones-filtrado'] })
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar el prospecto', {
        description: error.message,
      })
    },
  })
}
