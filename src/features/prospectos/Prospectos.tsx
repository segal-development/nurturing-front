/**
 * Container principal de la feature Prospectos
 * Orquesta todos los sub-componentes y hooks
 */

import { useState, useMemo } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ProspectosFilters } from './components/ProspectosFilters/ProspectosFilters'
import { ProspectosTable } from './components/ProspectosTable/ProspectosTable'
import { ProspectosSearch } from './components/ProspectosSearch/ProspectosSearch'
import { ProspectosPagination } from './components/ProspectosPagination/ProspectosPagination'
import { ProspectosUploadDialog } from './components/ProspectosUploadDialog/ProspectosUploadDialog'
import { useOpciones } from './hooks/useOpciones'
import { useProspectos } from './hooks/useProspectos'
import { useProspectosFilters } from './hooks/useProspectosFilters'
import { useProspectosPagination } from './hooks/useProspectosPagination'
import { searchProspectos } from './utils/searchProspectos'
import { Button } from '@/components/ui/button'

const ITEMS_PER_PAGE = 15

export function Prospectos() {
  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Query client para invalidar caché
  const queryClient = useQueryClient()

  // Hooks personalizados
  const { data: opciones, isLoading: isLoadingOpciones, isError: isErrorOpciones } = useOpciones()
  const { filtros, setImportacionId, setEstado, setTipo } = useProspectosFilters()
  const { currentPage, goToNextPage, goToPreviousPage, resetPage } = useProspectosPagination()

  // Hook para cargar prospectos
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

  // Filtrado client-side por búsqueda
  const filteredProspectos = useMemo(
    () => searchProspectos(prospectos, searchTerm),
    [prospectos, searchTerm]
  )

  // Cálculo de páginas totales
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // Handlers de filtros
  const handleFiltrosChange = (newFiltros: typeof filtros) => {
    setImportacionId(newFiltros.importacionId)
    setEstado(newFiltros.estado)
    setTipo(newFiltros.tipoProspectoId)
    resetPage()
    setSearchTerm('')
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    resetPage()
  }

  const handleExport = () => {
    console.log('Exportar prospectos filtrados:', filteredProspectos)
  }

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false)
    // Invalidar caché de opciones para recargar las importaciones
    queryClient.invalidateQueries({ queryKey: ['prospectos-opciones-filtrado'] })
  }

  const handlePageChange = (page: number) => {
    if (page === currentPage - 1) {
      goToPreviousPage()
    } else if (page === currentPage + 1) {
      goToNextPage(totalPages)
    }
  }

  // Loading estado inicial de opciones
  if (isLoadingOpciones) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
          <p className="text-segal-dark/60">Cargando opciones de filtrado...</p>
        </div>
      </div>
    )
  }

  // Error estado de opciones
  if (isErrorOpciones) {
    return (
      <div className="rounded-lg border border-segal-red/30 bg-segal-red/10 p-4">
        <p className="text-segal-red font-medium">
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
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark">Prospectos</h1>
          <p className="text-segal-dark/60">
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

      {/* Filtros */}
      <ProspectosFilters
        filtros={filtros}
        opciones={opciones}
        onFiltrosChange={handleFiltrosChange}
      />

      {/* Búsqueda (solo si hay importación seleccionada) */}
      {filtros.importacionId && (
        <ProspectosSearch
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={isLoadingProspectos}
        />
      )}

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
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
              <div className="text-sm text-segal-dark">
                Mostrando <span className="font-semibold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a{' '}
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
            <ProspectosPagination
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
