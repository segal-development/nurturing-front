/**
 * Hook para gestión centralizada del estado de filtros de flujos
 * Proporciona métodos para actualizar cada filtro individualmente
 */

import { useState, useCallback } from 'react'
import type { FiltrosState } from '../types/flujos'

const INITIAL_FILTERS: FiltrosState = {
  origenId: null,
  tipoDeudor: null,
}

export function useFlujosFilters() {
  const [filtros, setFiltros] = useState<FiltrosState>(INITIAL_FILTERS)

  const setOrigenId = useCallback((id: string | null) => {
    setFiltros((prev) => ({
      ...prev,
      origenId: id,
    }))
  }, [])

  const setTipoDeudor = useCallback((tipo: string | null) => {
    setFiltros((prev) => ({
      ...prev,
      tipoDeudor: tipo,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltros(INITIAL_FILTERS)
  }, [])

  return {
    filtros,
    setOrigenId,
    setTipoDeudor,
    resetFilters,
  }
}
