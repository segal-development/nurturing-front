/**
 * Hook genérico para gestión de paginación
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja estado de paginación
 * - Open/Closed: Extensible via parámetros sin modificar
 * - DRY: Reemplaza hooks duplicados en features
 * 
 * @example
 * const { currentPage, goToNextPage, goToPage, resetPage } = usePagination()
 * 
 * // Con página inicial personalizada
 * const pagination = usePagination({ initialPage: 2 })
 */

import { useCallback, useMemo, useState } from 'react'

// ============================================================================
// Types
// ============================================================================

interface UsePaginationOptions {
  /** Página inicial (default: 1) */
  initialPage?: number
}

interface UsePaginationReturn {
  /** Página actual */
  currentPage: number
  /** Navegar a la siguiente página (respeta límite de totalPages) */
  goToNextPage: (totalPages: number) => void
  /** Navegar a la página anterior (mínimo: 1) */
  goToPreviousPage: () => void
  /** Ir a una página específica */
  goToPage: (page: number) => void
  /** Resetear a la página inicial */
  resetPage: () => void
  /** Verificar si está en la primera página */
  isFirstPage: boolean
  /** Verificar si está en la última página (requiere totalPages) */
  isLastPage: (totalPages: number) => boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1 } = options
  
  const [currentPage, setCurrentPage] = useState(initialPage)

  /**
   * Navegar a la siguiente página
   * Usa Math.min para no exceder el total de páginas
   */
  const goToNextPage = useCallback((totalPages: number) => {
    if (totalPages <= 0) return
    
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }, [])

  /**
   * Navegar a la página anterior
   * Usa Math.max para no bajar de 1
   */
  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }, [])

  /**
   * Ir a una página específica
   * Valida que sea un número positivo
   */
  const goToPage = useCallback((page: number) => {
    if (page < 1) return
    
    setCurrentPage(page)
  }, [])

  /**
   * Resetear a la página inicial
   */
  const resetPage = useCallback(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  /**
   * Verificar si está en la primera página
   */
  const isFirstPage = useMemo(() => currentPage === 1, [currentPage])

  /**
   * Verificar si está en la última página
   */
  const isLastPage = useCallback((totalPages: number) => {
    return currentPage >= totalPages
  }, [currentPage])

  return {
    currentPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    resetPage,
    isFirstPage,
    isLastPage,
  }
}

// ============================================================================
// Type exports for consumers
// ============================================================================

export type { UsePaginationOptions, UsePaginationReturn }
