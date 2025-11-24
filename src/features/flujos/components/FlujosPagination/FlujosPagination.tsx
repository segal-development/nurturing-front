/**
 * Componente de paginación de flujos
 * Navegación entre páginas con números seleccionables y rango inteligente
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FlujosPaginationProps } from '../../types/flujos'

export function FlujosPagination({
  currentPage,
  totalPages,
  onPageChange,
}: FlujosPaginationProps) {
  // Calcular el rango de páginas a mostrar
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  // Ajustar el inicio si estamos cerca del final
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div className="flex flex-col gap-4 items-center justify-between p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
      <div className="text-sm text-segal-dark/70 w-full text-center">
        Página <span className="font-semibold">{currentPage}</span> de{' '}
        <span className="font-semibold">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        {/* Primera página (si no está en el rango) */}
        {startPage > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
              className="text-segal-blue hover:bg-segal-blue/10 w-8 h-8 p-0"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-segal-dark/40">...</span>}
          </>
        )}

        {/* Números de página */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            className={
              currentPage === page
                ? 'bg-segal-blue text-white hover:bg-segal-blue/90 w-8 h-8 p-0'
                : 'border-segal-blue/20 text-segal-blue hover:bg-segal-blue/10 w-8 h-8 p-0'
            }
          >
            {page}
          </Button>
        ))}

        {/* Última página (si no está en el rango) */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-segal-dark/40">...</span>}
            <Button
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
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
