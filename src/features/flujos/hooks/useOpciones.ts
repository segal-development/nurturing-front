/**
 * Hook para cargar opciones de filtrado de flujos (orígenes y tipos de deudor)
 */

import { useQuery } from '@tanstack/react-query'
import { flujosService } from '@/api/flujos.service'
import type { OpcionesFlujos } from '../types/flujos'

export function useOpciones() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flujos-opciones-filtrado'],
    queryFn: async () => {
      try {
        console.log('📥 useOpciones: Cargando opciones de filtrado...')
        const response = await flujosService.getOpciones()
        console.log('✅ useOpciones: Opciones cargadas:', response)
        return response
      } catch (err: any) {
        console.error('❌ useOpciones: Error cargando opciones:', err)
        throw err
      }
    },
  })

  console.log('🔍 useOpciones hook - data:', data)
  console.log('🔍 useOpciones hook - data.origenes:', (data as any)?.origenes)

  return {
    data: data as OpcionesFlujos | undefined,
    isLoading,
    isError,
    error,
  }
}
