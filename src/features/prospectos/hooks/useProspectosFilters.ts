/**
 * Hook para gestión centralizada del estado de filtros
 * Proporciona métodos para actualizar cada filtro individualmente
 */

import { useState, useCallback } from 'react'
import type { FiltrosState } from '../types/prospectos'

const INITIAL_FILTERS: FiltrosState = {
  importacionId: null,
  estado: null,
  tipoProspectoId: null,
}

export function useProspectosFilters() {
  const [filtros, setFiltros] = useState<FiltrosState>(INITIAL_FILTERS)

  const setImportacionId = useCallback((id: number | null) => {
    setFiltros((prev) => ({
      ...prev,
      importacionId: id,
    }))
  }, [])

  const setEstado = useCallback((estado: string | null) => {
    setFiltros((prev) => ({
      ...prev,
      estado,
    }))
  }, [])

  const setTipo = useCallback((tipo: number | null) => {
    setFiltros((prev) => ({
      ...prev,
      tipoProspectoId: tipo,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltros(INITIAL_FILTERS)
  }, [])

  return {
    filtros,
    setImportacionId,
    setEstado,
    setTipo,
    resetFilters,
  }
}
