/**
 * Hook para gestión de paginación de flujos
 * Maneja el estado de página actual y proporciona métodos de navegación
 */

import { useState, useCallback } from 'react'

export function useFlujoPagination() {
  const [currentPage, setCurrentPage] = useState(1)

  const goToNextPage = useCallback((totalPages: number) => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }, [])

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }, [])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    resetPage,
  }
}
