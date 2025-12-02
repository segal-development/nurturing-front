/**
 * Container principal de la feature Flujos
 * Orquesta todos los sub-componentes y hooks
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GitBranch, Loader2, AlertCircle } from 'lucide-react'
import { FlujosFilters } from './components/FlujosFilters/FlujosFilters'
import { FlujosTable } from './components/FlujosTable/FlujosTable'
import { FlujosPagination } from './components/FlujosPagination/FlujosPagination'
import { CreateFlujoWithBuilder } from './components/CreateFlujoWithBuilder/CreateFlujoWithBuilder'
import { FlujoDetailDialog } from './components/FlujoDetailDialog/FlujoDetailDialog'
import { EditFlujoBuilderDialog } from './components/EditFlujoBuilderDialog/EditFlujoBuilderDialog'
import { FlujoProgressPanel } from './components/FlujoProgressPanel/FlujoProgressPanel'
import { useOpciones } from './hooks/useOpciones'
import { useFlujosPage } from './hooks/useFlujosPage'
import { useFlujosFilters } from './hooks/useFlujosFilters'
import { useFlujoPagination } from './hooks/useFlujoPagination'
import { Button } from '@/components/ui/button'
import type { FlujoNurturing } from '@/types/flujo'

const ITEMS_PER_PAGE = 15

export function Flujos() {
  // Estado local
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [progressPanelOpen, setProgressPanelOpen] = useState(false)
  const [selectedFlujo, setSelectedFlujo] = useState<FlujoNurturing | null>(null)
  const [selectedFlujoId, setSelectedFlujoId] = useState<number | null>(null)

  // Query client para invalidar caché
  const queryClient = useQueryClient()

  // Hooks personalizados
  const { data: opciones, isLoading: isLoadingOpciones, isError: isErrorOpciones } = useOpciones()
  const { filtros, setOrigenId, setTipoDeudor } = useFlujosFilters()
  const { currentPage, goToNextPage, goToPreviousPage, resetPage } = useFlujoPagination()

  // Hook para cargar flujos
  const {
    data: flujos,
    total,
    isLoading: isLoadingFlujos,
    isError: isErrorFlujos,
    error: errorFlujos,
  } = useFlujosPage({
    origenId: filtros.origenId,
    tipoDeudor: filtros.tipoDeudor,
    page: currentPage,
    perPage: ITEMS_PER_PAGE,
  })

  // Cálculo de páginas totales
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // Handlers de filtros
  const handleFiltrosChange = (newFiltros: typeof filtros) => {
    setOrigenId(newFiltros.origenId)
    setTipoDeudor(newFiltros.tipoDeudor)
    resetPage()
  }

  const handlePageChange = (page: number) => {
    if (page === currentPage - 1) {
      goToPreviousPage()
    } else if (page === currentPage + 1) {
      goToNextPage(totalPages)
    } else {
      resetPage()
      // TODO: Implementar goToPage
    }
  }

  const handleCreateFlujo = () => {
    setCreateDialogOpen(true)
  }

  const handleCreateFlujoSuccess = () => {
    setCreateDialogOpen(false)
    // Invalidar caché de flujos para recargarlos - usar queryKey exacto con prefijo
    console.log('🔄 [handleCreateFlujoSuccess] Invalidando caché de flujos')
    queryClient.invalidateQueries({
      queryKey: ['flujos-page']
    })
    resetPage()
  }

  const handleViewFlujo = (id: number) => {
    const flujo = flujos.find((f) => f.id === id) || null
    setSelectedFlujo(flujo)
    setDetailDialogOpen(true)
  }

  const handleEditFlujo = (id: number) => {
    const flujo = flujos.find((f) => f.id === id) || null
    setSelectedFlujo(flujo)
    setEditDialogOpen(true)
  }

  const handleDeleteFlujo = () => {
    setDetailDialogOpen(false)
    setSelectedFlujo(null)
    // Invalidar caché de flujos para recargarlos - usar queryKey exacto con prefijo
    console.log('🔄 [handleDeleteFlujo] Invalidando caché de flujos')
    queryClient.invalidateQueries({
      queryKey: ['flujos-page']
    })
    resetPage()
  }

  const handleEjecutarFlujo = (flujoId: number) => {
    setSelectedFlujoId(flujoId)
    setProgressPanelOpen(true)
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
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2">
            <GitBranch className="h-8 w-8 text-segal-blue" />
            Flujos de Nurturing
          </h1>
          <p className="text-segal-dark/60 mt-2">
            {filtros.origenId
              ? `Gestiona y crea flujos de nurturing para ${
                  opciones?.origenes?.find((o) => o.id === filtros.origenId)?.nombre || 'este origen'
                }`
              : 'Selecciona un origen para ver los flujos disponibles'}
          </p>
        </div>
        <Button
          onClick={handleCreateFlujo}
          disabled={!filtros.origenId}
          className="bg-segal-blue hover:bg-segal-blue/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          Crear Nuevo Flujo
        </Button>
      </div>

      {/* Filtros */}
      <FlujosFilters
        filtros={filtros}
        opciones={opciones}
        onFiltrosChange={handleFiltrosChange}
        isLoadingOpciones={isLoadingOpciones}
      />

      {/* Loading flujos */}
      {filtros.origenId && isLoadingFlujos && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
            <p className="text-segal-dark/60">Cargando flujos...</p>
          </div>
        </div>
      )}

      {/* Error flujos */}
      {filtros.origenId && isErrorFlujos && (
        <div className="rounded-lg border border-segal-red/30 bg-segal-red/10 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-segal-red shrink-0 mt-0.5" />
          <div>
            <p className="text-segal-red font-medium">Error al cargar los flujos</p>
            <p className="text-sm text-segal-red/80 mt-1">
              {errorFlujos instanceof Error ? errorFlujos.message : 'Intenta de nuevo más tarde'}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!filtros.origenId && (
        <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-segal-blue/50 mx-auto mb-4" />
          <p className="text-lg font-semibold text-segal-dark mb-2">Selecciona un origen</p>
          <p className="text-segal-dark/60">
            Elige un origen del selector anterior para ver los flujos disponibles
          </p>
        </div>
      )}

      {/* Resumen de registros */}
      {filtros.origenId && flujos.length > 0 && !isLoadingFlujos && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
          <div className="text-sm text-segal-dark">
            Mostrando <span className="font-semibold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a{' '}
            <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> de{' '}
            <span className="font-semibold text-segal-blue">{total}</span> flujos
          </div>
        </div>
      )}

      {/* Tabla y Paginación */}
      {filtros.origenId && !isLoadingFlujos && (
        <>
          <FlujosTable
            flujos={flujos}
            onViewFlujo={handleViewFlujo}
            onEditFlujo={handleEditFlujo}
            onDeleteFlujo={handleDeleteFlujo}
            onEjecutarFlujo={handleEjecutarFlujo}
          />

          {flujos.length > 0 && totalPages > 1 && (
            <FlujosPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {flujos.length === 0 && (
            <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-segal-blue/50 mx-auto mb-3" />
              <p className="text-segal-dark/60">No hay flujos para este origen</p>
            </div>
          )}
        </>
      )}

      {/* Dialog para crear flujo con FlowBuilder */}
      <CreateFlujoWithBuilder
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        opciones={opciones}
        onSuccess={handleCreateFlujoSuccess}
      />

      {/* Dialog para ver detalle del flujo */}
      <FlujoDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        flujo={selectedFlujo}
        onEdit={() => {
          setDetailDialogOpen(false)
          setEditDialogOpen(true)
        }}
        onDelete={handleDeleteFlujo}
      />

      {/* Dialog para editar flujo con canvas visual */}
      <EditFlujoBuilderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        flujo={selectedFlujo}
      />

      {/* Panel de progreso de ejecución */}
      <FlujoProgressPanel
        open={progressPanelOpen}
        onOpenChange={setProgressPanelOpen}
        flujoId={selectedFlujoId}
        flujNombre={selectedFlujo?.nombre || 'Ejecución de Flujo'}
        onClose={() => {
          setProgressPanelOpen(false)
          setSelectedFlujoId(null)
        }}
      />
    </div>
  )
}
