/**
 * Componente genérico de paginación
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo renderiza controles de paginación
 * - Open/Closed: Extensible via props sin modificar
 * - DRY: Reemplaza componentes duplicados en features
 * 
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => console.log(page)}
 * />
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'

// ============================================================================
// Types
// ============================================================================

export interface PaginationProps {
  /** Página actual (1-based) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Callback cuando cambia la página */
  onPageChange: (page: number) => void
  /** Máximo de botones de página a mostrar (default: 5) */
  maxPagesToShow?: number
  /** Mostrar texto de "Página X de Y" (default: true) */
  showPageInfo?: boolean
  /** Clase CSS adicional para el contenedor */
  className?: string
}

// ============================================================================
// Helper Functions (Pure Functions - SRP)
// ============================================================================

/**
 * Calcula el rango de páginas a mostrar
 * Mantiene el número de botones consistente y centra la página actual
 */
function calculatePageRange(
  currentPage: number,
  totalPages: number,
  maxPagesToShow: number
): { startPage: number; endPage: number; pageNumbers: number[] } {
  // Early return para casos edge
  if (totalPages <= 0) {
    return { startPage: 1, endPage: 1, pageNumbers: [1] }
  }

  // Calcular inicio centrado en la página actual
  const initialStartPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  const endPage = Math.min(totalPages, initialStartPage + maxPagesToShow - 1)

  // Ajustar inicio si estamos cerca del final
  const startPage = (endPage - initialStartPage + 1 < maxPagesToShow)
    ? Math.max(1, endPage - maxPagesToShow + 1)
    : initialStartPage

  // Generar array de números de página
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  )

  return { startPage, endPage, pageNumbers }
}

// ============================================================================
// Component
// ============================================================================

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxPagesToShow = 5,
  showPageInfo = true,
  className = '',
}: PaginationProps) {
  // Calcular rango de páginas (memoizado para performance)
  const { startPage, endPage, pageNumbers } = useMemo(
    () => calculatePageRange(currentPage, totalPages, maxPagesToShow),
    [currentPage, totalPages, maxPagesToShow]
  )

  // Early return si no hay páginas
  if (totalPages <= 1) {
    return null
  }

  // Verificar estados de navegación
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages
  const showFirstPageEllipsis = startPage > 2
  const showLastPageEllipsis = endPage < totalPages - 1
  const showFirstPageButton = startPage > 1
  const showLastPageButton = endPage < totalPages

  return (
    <div
      className={`flex flex-col gap-4 items-center justify-between p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10 ${className}`}
    >
      {/* Información de página */}
      {showPageInfo && (
        <div className="text-sm text-segal-dark/70 w-full text-center dark:text-segal-blue">
          Página <span className="font-semibold">{currentPage}</span> de{' '}
          <span className="font-semibold">{totalPages}</span>
        </div>
      )}

      {/* Controles de navegación */}
      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        {/* Primera página (si no está en el rango) */}
        {showFirstPageButton && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
              className="text-segal-blue hover:bg-segal-blue/10 w-8 h-8 p-0"
            >
              1
            </Button>
            {showFirstPageEllipsis && (
              <span className="text-segal-dark/40">...</span>
            )}
          </>
        )}

        {/* Números de página */}
        {pageNumbers.map((page) => {
          const isCurrentPage = currentPage === page
          return (
            <Button
              key={page}
              type="button"
              variant={isCurrentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={
                isCurrentPage
                  ? 'bg-segal-blue text-white hover:bg-segal-blue/90 w-8 h-8 p-0'
                  : 'border-segal-blue/20 text-segal-blue hover:bg-segal-blue/10 w-8 h-8 p-0'
              }
            >
              {page}
            </Button>
          )
        })}

        {/* Última página (si no está en el rango) */}
        {showLastPageButton && (
          <>
            {showLastPageEllipsis && (
              <span className="text-segal-dark/40">...</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="text-segal-blue hover:bg-segal-blue/10 w-8 h-8 p-0"
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Botón Siguiente */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
