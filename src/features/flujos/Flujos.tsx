/**
 * Container principal de la feature Flujos
 * Orquesta todos los sub-componentes y hooks
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { GitBranch, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { FlujosFilters } from './components/FlujosFilters/FlujosFilters'
import { FlujosTable } from './components/FlujosTable/FlujosTable'
import { Pagination } from '@/components/shared/Pagination'
import { CreateFlujoWithBuilder } from './components/CreateFlujoWithBuilder/CreateFlujoWithBuilder'
import { FlujoDetailDialog } from './components/FlujoDetailDialog/FlujoDetailDialog'
import { EditFlujoBuilderDialog } from './components/EditFlujoBuilderDialog/EditFlujoBuilderDialog'
import { FlujoProgressPanel } from './components/FlujoProgressPanel/FlujoProgressPanel'
import { FlujoProcesamientoIndicator } from './components/FlujoProcesamientoIndicator'
import { useFlujoOpciones } from './hooks/useFlujoOpciones'
import { useFlujosPage } from './hooks/useFlujosPage'
import { useFlujosFilters } from './hooks/useFlujosFilters'
import { useFlujoProcesamiento } from './hooks/useFlujoProcesamiento'
import { usePagination } from '@/hooks/usePagination'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { flujosService } from '@/api/flujos.service'
import type { FlujoNurturing } from '@/types/flujo'

const ITEMS_PER_PAGE = 15

export function Flujos() {
  // Estado local para diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [progressPanelOpen, setProgressPanelOpen] = useState(false)

  // Estado para flujos seleccionados
  const [selectedFlujo, setSelectedFlujo] = useState<FlujoNurturing | null>(null)
  const [selectedFlujoId, setSelectedFlujoId] = useState<number | null>(null)
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null)

  // Estado para crear flujo desde origen preseleccionado
  const [initialOriginIdForCreation, setInitialOriginIdForCreation] = useState<string | null>(null)

  // Estado para eliminación de flujo
  const [flujoToDelete, setFlujoToDelete] = useState<FlujoNurturing | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Query client para invalidar caché
  const queryClient = useQueryClient()

  // Hooks personalizados
  const { data: opciones, isLoading: isLoadingOpciones, isError: isErrorOpciones } = useFlujoOpciones()
  const { filtros, setOrigenId, setTipoDeudor } = useFlujosFilters()
  const { currentPage, goToNextPage, goToPreviousPage, goToPage, resetPage } = usePagination()

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

  // Hook para detectar cuando termina el procesamiento de prospectos
  // y refrescar automáticamente la tabla
  useFlujoProcesamiento({
    onComplete: () => {
      console.log('✅ Procesamiento de prospectos completado - refrescando tabla')
      queryClient.invalidateQueries({
        queryKey: ['flujos-page'],
      })
    },
  })

  // Handlers de filtros
  const handleFiltrosChange = (newFiltros: typeof filtros) => {
    setOrigenId(newFiltros.origenId)
    setTipoDeudor(newFiltros.tipoDeudor)
    resetPage()
  }

  /**
   * Navega entre páginas con early returns
   */
  const handlePageChange = (page: number) => {
    if (page === currentPage - 1) {
      goToPreviousPage()
      return
    }

    if (page === currentPage + 1) {
      goToNextPage(totalPages)
      return
    }

    goToPage(page)
  }

  /**
   * Invalida caché de flujos y reinicia paginación
   */
  const invalidateFlujosCache = () => {
    console.log('🔄 Invalidando caché de flujos y reiniciando paginación')
    queryClient.invalidateQueries({
      queryKey: ['flujos-page']
    })
    resetPage()
  }

  /**
   * Abre modal para crear nuevo flujo con origen preseleccionado si existe
   */
  const handleCreateFlujo = () => {
    setInitialOriginIdForCreation(filtros.origenId)
    setCreateDialogOpen(true)
  }

  /**
   * Limpia estado después de crear flujo exitosamente
   */
  const handleCreateFlujoSuccess = () => {
    setCreateDialogOpen(false)
    setInitialOriginIdForCreation(null)
    invalidateFlujosCache()
  }

  /**
   * Cierra modal de creación y limpia origen inicial
   */
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false)
    setInitialOriginIdForCreation(null)
  }

  /**
   * Busca flujo por ID y lo abre en modal de detalle
   */
  const handleViewFlujo = (flujoId: number) => {
    const flujoEncontrado = flujos.find((flujo) => flujo.id === flujoId) ?? null
    setSelectedFlujo(flujoEncontrado)
    setDetailDialogOpen(true)
  }

  /**
   * Busca flujo por ID y lo abre en modal de edición
   */
  const handleEditFlujo = (flujoId: number) => {
    const flujoEncontrado = flujos.find((flujo) => flujo.id === flujoId) ?? null
    setSelectedFlujo(flujoEncontrado)
    setEditDialogOpen(true)
  }

  /**
   * Abre dialog de confirmación para eliminar flujo
   */
  const handleDeleteFlujo = (flujoId: number) => {
    const flujoEncontrado = flujos.find((flujo) => flujo.id === flujoId) ?? null
    setFlujoToDelete(flujoEncontrado)
  }

  /**
   * Callback para cuando el flujo se elimina desde el modal de detalle
   */
  const handleDeleteFromDetail = () => {
    setDetailDialogOpen(false)
    setSelectedFlujo(null)
    invalidateFlujosCache()
  }

  /**
   * Confirma y ejecuta la eliminación del flujo
   */
  const handleConfirmDelete = async () => {
    if (!flujoToDelete?.id) return

    setIsDeleting(true)
    try {
      const result = await flujosService.delete(flujoToDelete.id)
      toast.success(`Flujo "${flujoToDelete.nombre}" eliminado correctamente`, {
        description: result.mensaje || 'El flujo y todos sus datos asociados han sido eliminados',
      })
      setFlujoToDelete(null)
      invalidateFlujosCache()
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Error al eliminar el flujo'
      toast.error('Error al eliminar el flujo', {
        description: errorMessage,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Abre panel de ejecución para un flujo específico
   */
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
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2 dark:text-white">
            <GitBranch className="h-8 w-8 text-segal-blue" />
            Flujos de Nurturing
          </h1>
          <p className="text-segal-dark/60 mt-2 dark:text-white">
            {filtros.origenId
              ? `Gestiona y crea flujos de nurturing para ${
                  opciones?.origenes?.find((o) => o.id === filtros.origenId)?.nombre || 'este origen'
                }`
              : 'Selecciona un origen para ver los flujos disponibles'}
          </p>
        </div>
        <Button
          onClick={handleCreateFlujo}
          className="bg-segal-blue hover:bg-segal-blue/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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

      {/* Empty state - No origen seleccionado */}
      {!filtros.origenId && (
        <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-segal-blue/50 mx-auto mb-4" />
          <p className="text-lg font-semibold text-segal-dark mb-2 dark:text-white">Selecciona un origen</p>
          <p className="text-segal-dark/60 dark:text-white">
            Elige un origen del selector anterior para ver los flujos disponibles
          </p>
        </div>
      )}

      {/* Resumen de registros */}
      {filtros.origenId && flujos.length > 0 && !isLoadingFlujos && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
          <div className="text-sm text-segal-dark dark:text-gray-300">
            Mostrando <span className="font-semibold dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a{' '}
            <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> de{' '}
            <span className="font-semibold text-segal-blue">{total}</span> flujos
          </div>
        </div>
      )}

      {/* Tabla y Paginación - Mostrar tabla siempre que haya origen seleccionado */}
      {filtros.origenId && !isLoadingFlujos && !isErrorFlujos && (
        <>
          <FlujosTable
            flujos={flujos}
            onViewFlujo={handleViewFlujo}
            onEditFlujo={handleEditFlujo}
            onDeleteFlujo={handleDeleteFlujo}
            onEjecutarFlujo={handleEjecutarFlujo}
          />

          {flujos.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {flujos.length === 0 && (
            <div className="rounded-lg border border-segal-blue/20 bg-segal-blue/5 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-segal-blue/50 mx-auto mb-3" />
              <p className="text-segal-dark/60 dark:text-white">No hay flujos para este origen</p>
            </div>
          )}
        </>
      )}

      {/* Dialog para crear flujo con FlowBuilder */}
      <CreateFlujoWithBuilder
        open={createDialogOpen}
        onOpenChange={handleCreateDialogClose}
        opciones={opciones}
        onSuccess={handleCreateFlujoSuccess}
        initialOriginId={initialOriginIdForCreation}
      />

      {/* Dialog para ver detalle del flujo */}
      <FlujoDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        flujo={selectedFlujo}
        executionId={currentExecutionId || undefined}
        onEdit={() => {
          setDetailDialogOpen(false)
          setEditDialogOpen(true)
        }}
        onDelete={handleDeleteFromDetail}
        onExecutionStart={(ejecucionId) => {
          setCurrentExecutionId(ejecucionId.toString())
        }}
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

      {/* Indicador flotante de procesamiento de prospectos (visible cuando hay flujo creándose) */}
      <FlujoProcesamientoIndicator variant="floating" />

      {/* Dialog de confirmación para eliminar flujo */}
      <AlertDialog
        open={!!flujoToDelete}
        onOpenChange={(open) => {
          // Prevenir cierre mientras está eliminando
          if (isDeleting) return
          if (!open) setFlujoToDelete(null)
        }}
      >
        <AlertDialogContent className="bg-white">
          {isDeleting ? (
            // Estado de carga
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-10 w-10 text-segal-red animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-segal-dark">Eliminando flujo...</p>
                <p className="text-sm text-segal-dark/60 mt-1">
                  Esto puede tomar unos segundos si hay muchos registros asociados.
                </p>
              </div>
            </div>
          ) : (
            // Estado de confirmación
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-segal-dark">
                  <Trash2 className="h-5 w-5 text-segal-red" />
                  ¿Eliminar flujo?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-segal-dark/70">
                  Estás a punto de eliminar el flujo <strong>"{flujoToDelete?.nombre}"</strong>.
                  Esta acción no se puede deshacer y eliminará todas las etapas y datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault() // Prevent auto-close, we'll close manually after delete
                    handleConfirmDelete()
                  }}
                  className="bg-segal-red hover:bg-segal-red/90 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
