/**
 * Filtra prospectos por término de búsqueda (client-side)
 * Busca en nombre, email y teléfono
 */

import type { Prospecto } from '../types/prospectos'

export function searchProspectos(prospectos: Prospecto[], searchTerm: string): Prospecto[] {
  if (!searchTerm || !searchTerm.trim()) {
    return prospectos
  }

  const searchLower = searchTerm.toLowerCase()
  return prospectos.filter((prospecto) => {
    return (
      (prospecto.nombre && prospecto.nombre.toLowerCase().includes(searchLower)) ||
      (prospecto.email && prospecto.email.toLowerCase().includes(searchLower)) ||
      (prospecto.telefono && prospecto.telefono.includes(searchTerm))
    )
  })
}
