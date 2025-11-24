/**
 * Hook para cargar opciones de filtrado (importaciones, estados, tipos)
 * Se carga una sola vez en el montaje del componente
 */

import { useQuery } from '@tanstack/react-query'
import { prospectosService } from '@/api/prospectos.service'
import type { OpcionesFiltrado } from '../types/prospectos'

export function useOpciones() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['prospectos-opciones-filtrado'],
    queryFn: async () => {
      try {
        console.log('📥 useOpciones: Cargando opciones de filtrado...')
        const response = await prospectosService.getOpciones()
        console.log('📥 useOpciones: response tipo:', typeof response)
        console.log('📥 useOpciones: response keys:', Object.keys(response))
        console.log('📥 useOpciones: response.importaciones:', (response as any).importaciones)
        console.log('✅ useOpciones: Opciones cargadas:', response)
        return response
      } catch (err: any) {
        console.error('❌ useOpciones: Error cargando opciones:', err)
        throw err
      }
    },
  })

  console.log('🔍 useOpciones hook - data:', data)
  console.log('🔍 useOpciones hook - data.importaciones:', (data as any)?.importaciones)

  return {
    data: data as OpcionesFiltrado | undefined,
    isLoading,
    isError,
    error,
  }
}
