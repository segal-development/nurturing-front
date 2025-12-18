/**
 * Container principal de la feature Prospectos
 * Orquesta todos los sub-componentes y hooks
 *
 * SOLID Principles:
 * - Single Responsibility: Orchestrates state and data flow only
 * - Dependency Injection: Receives all dependencies via hooks/props
 * - Separation of Concerns: Business logic in hooks, UI in components
 */

import { useState, useMemo, useCallback } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { CompactFiltersBar } from './components/ProspectosFilters/CompactFiltersBar'
import { ProspectosTable } from './components/ProspectosTable/ProspectosTable'
import { Pagination } from '@/components/shared/Pagination'
import { ProspectosUploadDialog } from './components/ProspectosUploadDialog/ProspectosUploadDialog'
import { useProspectosOpciones } from './hooks/useProspectosOpciones'
import { useProspectos } from './hooks/useProspectos'
import { useProspectosFilters } from './hooks/useProspectosFilters'
import { usePagination } from '@/hooks/usePagination'
import { searchProspectos } from './utils/searchProspectos'
import { Button } from '@/components/ui/button'

const ITEMS_PER_PAGE = 15

/**
 * Calcula el número total de páginas
 */
const calculateTotalPages = (total: number, itemsPerPage: number): number => {
  return Math.ceil(total / itemsPerPage)
}

export function Prospectos() {
  // ============================================================
  // ESTADO LOCAL
  // ============================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // ============================================================
  // DEPENDENCIAS EXTERNAS
  // ============================================================
  const queryClient = useQueryClient()
  const { data: opciones, isLoading: isLoadingOpciones, isError: isErrorOpciones } = useProspectosOpciones()
  const { filtros, setImportacionId, setEstado, setTipo } = useProspectosFilters()
  const { currentPage, goToNextPage, goToPreviousPage, goToPage, resetPage } = usePagination()

  // ============================================================
  // DATOS DE PROSPECTOS
  // ============================================================
  const {
    data: prospectos,
    total,
    isLoading: isLoadingProspectos,
    isError: isErrorProspectos,
    error: errorProspectos,
  } = useProspectos({
    importacionId: filtros.importacionId,
    estado: filtros.estado,
    tipoProspectoId: filtros.tipoProspectoId,
    page: currentPage,
    perPage: ITEMS_PER_PAGE,
  })

  // ============================================================
  // DATOS DERIVADOS
  // ============================================================
  const filteredProspectos = useMemo(
    () => searchProspectos(prospectos, searchTerm),
    [prospectos, searchTerm]
  )

  const totalPages = calculateTotalPages(total, ITEMS_PER_PAGE)

  // ============================================================
  // MANEJADORES DE EVENTOS
  // ============================================================
  const handleFiltrosChange = useCallback((newFiltros: typeof filtros) => {
    setImportacionId(newFiltros.importacionId)
    setEstado(newFiltros.estado)
    setTipo(newFiltros.tipoProspectoId)
    resetPage()
    setSearchTerm('')
  }, [setImportacionId, setEstado, setTipo, resetPage])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    resetPage()
  }, [resetPage])

  const handleExport = useCallback(() => {
    console.log('Exportar prospectos filtrados:', filteredProspectos)
  }, [filteredProspectos])

  const handleUploadSuccess = useCallback(() => {
    setUploadDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ['prospectos-opciones-filtrado'] })
  }, [queryClient])

  const handlePageChange = useCallback((newPage: number) => {
    const isNextPage = newPage === currentPage + 1
    const isPreviousPage = newPage === currentPage - 1

    if (isPreviousPage) {
      goToPreviousPage()
    } else if (isNextPage) {
      goToNextPage(totalPages)
    } else {
      goToPage(newPage)
    }
  }, [currentPage, totalPages, goToNextPage, goToPreviousPage, goToPage])

  // ============================================================
  // EARLY RETURNS: ESTADOS DE CARGA Y ERROR
  // ============================================================
  if (isLoadingOpciones) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-gray-300" />
          <p className="text-segal-dark/60">Cargando opciones de filtrado...</p>
        </div>
      </div>
    )
  }

  if (isErrorOpciones) {
    return (
      <div className="rounded-lg border border-segal-red/30 bg-segal-red/10 p-4">
        <p className="text-segal-red font-medium dark:text-gray-300">
          Error al cargar las opciones de filtrado. Intenta de nuevo más tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark dark:text-gray-300">Prospectos</h1>
          <p className="text-segal-dark/60 dark:text-gray-300">
            {filtros.importacionId
              ? `Prospectos filtrados por fuente de importación`
              : 'Selecciona una fuente de importación para comenzar'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!filtros.importacionId}
            className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <ProspectosUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onSuccess={handleUploadSuccess} />
        </div>
      </div>

      {/* Barra compacta de filtros y búsqueda */}
      <CompactFiltersBar
        filtros={filtros}
        opciones={opciones}
        searchValue={searchTerm}
        onFiltrosChange={handleFiltrosChange}
        onSearchChange={handleSearchChange}
        isSearchDisabled={isLoadingProspectos}
      />

      {/* Loading prospectos */}
      {filtros.importacionId && isLoadingProspectos && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
            <p className="text-segal-dark/60">Cargando prospectos...</p>
          </div>
        </div>
      )}

      {/* Error prospectos */}
      {filtros.importacionId && isErrorProspectos && (
        <div className="rounded-lg border border-segal-red/30 bg-segal-red/10 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-segal-red shrink-0 mt-0.5" />
          <div>
            <p className="text-segal-red font-medium">Error al cargar los prospectos</p>
            <p className="text-sm text-segal-red/80 mt-1">
              {errorProspectos instanceof Error ? errorProspectos.message : 'Intenta de nuevo más tarde'}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!filtros.importacionId && (
        <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-segal-blue/50 mx-auto mb-4" />
          <p className="text-lg font-semibold text-segal-dark mb-2">Selecciona una fuente de importación</p>
          <p className="text-segal-dark/60">
            Elige una fuente de importación del selector anterior para ver los prospectos disponibles
          </p>
        </div>
      )}

      {/* Tabla y Paginación */}
      {filtros.importacionId && !isLoadingProspectos && (
        <>
          {/* Resumen de registros */}
          {prospectos.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
              <div className="text-sm text-segal-dark dark:text-gray-300">
                Mostrando <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> de{' '}
                <span className="font-semibold text-segal-blue">{total}</span> registros
              </div>
              {searchTerm && (
                <div className="text-sm text-segal-dark/70">
                  (Búsqueda: <span className="font-semibold">{searchTerm}</span>)
                </div>
              )}
            </div>
          )}

          <ProspectosTable
            prospectos={filteredProspectos}
            onViewProspecto={(id) => console.log('Ver prospecto:', id)}
          />

          {prospectos.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {prospectos.length === 0 && !searchTerm && (
            <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-segal-blue/50 mx-auto mb-3" />
              <p className="text-segal-dark/60">No hay prospectos en esta importación</p>
            </div>
          )}

          {filteredProspectos.length === 0 && searchTerm && (
            <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-segal-blue/50 mx-auto mb-3" />
              <p className="text-segal-dark/60">
                No se encontraron prospectos con el término de búsqueda "<span className="font-semibold">{searchTerm}</span>"
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
