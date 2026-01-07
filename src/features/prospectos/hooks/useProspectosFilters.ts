/**
 * Hook para gestión centralizada del estado de filtros
 * Proporciona métodos para actualizar cada filtro individualmente
 */

import { useState, useCallback } from 'react'
import type { FiltrosState } from '../types/prospectos'

const INITIAL_FILTERS: FiltrosState = {
  loteId: null,
  importacionId: null, // Mantener para compatibilidad
  estado: null,
  tipoProspectoId: null,
}

export function useProspectosFilters() {
  const [filtros, setFiltros] = useState<FiltrosState>(INITIAL_FILTERS)

  const setLoteId = useCallback((id: number | null) => {
    setFiltros((prev) => ({
      ...prev,
      loteId: id,
      importacionId: null, // Limpiar importacionId cuando cambia el lote
    }))
  }, [])

  // Mantener para compatibilidad
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
    setLoteId,
    setImportacionId,
    setEstado,
    setTipo,
    resetFilters,
  }
}
