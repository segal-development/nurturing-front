/**
 * Hook para cargar y cachear plantillas filtradas por tipo
 * Utilizando React Query para state management del servidor
 */

import { useQuery } from '@tanstack/react-query'
import { plantillasService } from '@/api/plantillas.service'
import type { PlantillaSMS, PlantillaEmail } from '@/types/plantilla'

/**
 * Hook para obtener plantillas filtradas por tipo
 * @param tipo - 'sms' | 'email' | 'ambos' (returns all) | undefined (returns all)
 * @param enabled - Habilitar/deshabilitar la query
 */
export function usePlantillas(tipo?: 'sms' | 'email' | 'ambos', enabled: boolean = true) {
  return useQuery({
    queryKey: ['plantillas-flujos', tipo],
    queryFn: async () => {
      const response = await plantillasService.getAll({
        tipo: tipo && tipo !== 'ambos' ? tipo : undefined,
        activo: true,
        pagina: 1,
        por_pagina: 100,
      })
      return response.data || []
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener plantillas SMS
 */
export function usePlantillasSMS(enabled: boolean = true) {
  return useQuery({
    queryKey: ['plantillas-flujos-sms'],
    queryFn: async () => {
      const response = await plantillasService.getAll({
        tipo: 'sms',
        activo: true,
        pagina: 1,
        por_pagina: 100,
      })
      return (response.data || []) as PlantillaSMS[]
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener plantillas Email
 */
export function usePlantillasEmail(enabled: boolean = true) {
  return useQuery({
    queryKey: ['plantillas-flujos-email'],
    queryFn: async () => {
      const response = await plantillasService.getAll({
        tipo: 'email',
        activo: true,
        pagina: 1,
        por_pagina: 100,
      })
      return (response.data || []) as PlantillaEmail[]
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener una plantilla específica por ID
 */
export function usePlantillaById(plantillaId?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['plantilla-flujos', plantillaId],
    queryFn: async () => {
      if (!plantillaId) return null
      const plantilla = await plantillasService.getById(plantillaId)
      return plantilla
    },
    enabled: enabled && !!plantillaId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener múltiples plantillas por ID
 */
export function usePlantillasById(plantillaIds?: number[], enabled: boolean = true) {
  return useQuery({
    queryKey: ['plantillas-flujos-byid', plantillaIds],
    queryFn: async () => {
      if (!plantillaIds || plantillaIds.length === 0) return []
      const plantillas = await Promise.all(
        plantillaIds.map((id) => plantillasService.getById(id))
      )
      return plantillas
    },
    enabled: enabled && !!plantillaIds && plantillaIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}
