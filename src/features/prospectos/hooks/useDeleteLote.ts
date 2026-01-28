/**
 * Hook para eliminar un lote/carga
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { prospectosService } from '@/api/prospectos.service'
import { toast } from 'sonner'

export function useDeleteLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (loteId: number) => prospectosService.deleteLote(loteId),
    onSuccess: (data) => {
      toast.success('Carga eliminada correctamente', {
        description: data.prospectos_eliminados > 0 
          ? `Se eliminaron ${data.prospectos_eliminados} prospectos`
          : undefined,
      })
      // Invalidar queries para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['prospectos'] })
      queryClient.invalidateQueries({ queryKey: ['prospectos-opciones-filtrado'] })
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar la carga', {
        description: error.message,
      })
    },
  })
}
