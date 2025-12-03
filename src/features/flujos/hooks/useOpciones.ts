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
    staleTime: 2 * 60 * 1000, // Datos considerados "frescos" por 2 minutos
    gcTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
    refetchOnMount: true, // Siempre refetch al montar el componente
    refetchOnWindowFocus: true, // Refetch cuando vuelve el foco a la ventana
    refetchInterval: 3 * 60 * 1000, // Refetch automático cada 3 minutos
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
