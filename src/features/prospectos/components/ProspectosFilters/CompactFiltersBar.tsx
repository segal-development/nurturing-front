/**
 * Barra compacta de filtros y búsqueda
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles filter UI and state binding
 * - Composition: Uses small, focused sub-components
 * - Dependency Injection: Receives all data and callbacks via props
 * 
 * CAMBIO IMPORTANTE: Ahora usa LOTES en lugar de importaciones individuales
 * Un lote agrupa múltiples archivos de una misma carga
 */

import { Search, FileStack, CheckCircle2, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { OpcionesFiltrado, FiltrosState, LoteOpcion } from '../../types/prospectos'

/**
 * Props para CompactFiltersBar
 */
interface CompactFiltersBarProps {
  filtros: FiltrosState
  opciones: OpcionesFiltrado | undefined
  searchValue: string
  onFiltrosChange: (filtros: FiltrosState) => void
  onSearchChange: (value: string) => void
  isSearchDisabled?: boolean
  onDeleteLote?: (loteId: number) => void
  isDeletingLote?: boolean
}

/**
 * Crea un nuevo estado de filtros con una propiedad actualizada
 */
const createUpdatedFilters = (
  currentFilters: FiltrosState,
  updates: Partial<FiltrosState>
): FiltrosState => ({
  ...currentFilters,
  ...updates,
})

/**
 * Convierte un ID de tipo a número, retornando null si no es válido
 */
const parseTypeIdSafely = (value: string | null): number | null => {
  if (!value || value === 'todos-tipos') return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

/**
 * Obtiene el valor mostrado en el select (convierte a string o undefined)
 */
const getSelectDisplayValue = (value: number | null | undefined): string | undefined => {
  return value ? value.toString() : undefined
}

/**
 * Obtiene el ícono de estado del lote
 */
const getLoteStatusIcon = (estado: LoteOpcion['estado']) => {
  switch (estado) {
    case 'completado':
      return <CheckCircle2 className="h-3 w-3 text-green-500" />
    case 'procesando':
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
    case 'fallido':
      return <AlertCircle className="h-3 w-3 text-red-500" />
    default:
      return <FileStack className="h-3 w-3 text-gray-400" />
  }
}

/**
 * Formatea el número con separador de miles
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString('es-AR')
}

export function CompactFiltersBar({
  filtros,
  opciones,
  searchValue,
  onFiltrosChange,
  onSearchChange,
  isSearchDisabled = false,
  onDeleteLote,
  isDeletingLote = false,
}: CompactFiltersBarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // ============================================================
  // MANEJADORES DE FILTROS CON EARLY RETURNS
  // ============================================================
  const handleLoteChange = (value: string) => {
    const parsedId = parseInt(value, 10)
    if (isNaN(parsedId)) return

    const updatedFilters = createUpdatedFilters(filtros, { 
      loteId: parsedId,
      importacionId: null // Limpiar importacionId cuando cambia el lote
    })
    onFiltrosChange(updatedFilters)
  }

  const handleEstadoChange = (value: string | null) => {
    if (!value) return

    const estadoValue = value === 'todos-estados' ? null : value
    const updatedFilters = createUpdatedFilters(filtros, { estado: estadoValue })
    onFiltrosChange(updatedFilters)
  }

  const handleTipoChange = (value: string | null) => {
    if (!value) return

    const tipoValue = parseTypeIdSafely(value)
    const updatedFilters = createUpdatedFilters(filtros, { tipoProspectoId: tipoValue })
    onFiltrosChange(updatedFilters)
  }

  // ============================================================
  // VALORES MOSTRADOS EN SELECTS
  // ============================================================
  const selectValueLote = getSelectDisplayValue(filtros.loteId)
  const selectValueEstado = filtros.estado || 'todos-estados'
  const selectValueTipo = getSelectDisplayValue(filtros.tipoProspectoId) || 'todos-tipos'

  // Obtener el lote seleccionado para mostrar info
  const loteSeleccionado = opciones?.lotes?.find(l => l.id === filtros.loteId)

  // Determinar si hay filtro activo (lote o importación para compatibilidad)
  const hasActiveFilter = !!filtros.loteId || !!filtros.importacionId

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-segal-blue/5 border border-segal-blue/10">
      {/* Primera fila: Lote/Carga + Estado */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight dark:text-gray-300">
            Carga <span className="text-segal-red">*</span>
          </label>
          {opciones?.lotes && opciones.lotes.length > 0 ? (
            <Select value={selectValueLote} onValueChange={handleLoteChange}>
              <SelectTrigger className="h-9 w-full text-sm border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20 truncate dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
                <SelectValue placeholder="Selecciona una carga..." className="truncate" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20 max-h-80">
                {opciones?.lotes?.map((lote) => (
                  <SelectItem key={lote.id} value={lote.id.toString()}>
                    <div className="flex items-center gap-2">
                      {getLoteStatusIcon(lote.estado)}
                      <span className="text-xs truncate max-w-[200px]">
                        {lote.nombre}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({lote.total_archivos} {lote.total_archivos === 1 ? 'archivo' : 'archivos'} - {formatNumber(lote.total_prospectos)} registros)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 rounded-lg border border-segal-blue/30 bg-white text-xs text-segal-dark/60 flex items-center dark:text-gray-300">
              {opciones?.lotes?.length === 0 ? 'Sin cargas disponibles' : 'Cargando...'}
            </div>
          )}
        </div>

        {/* Filtro Estado - solo si hay lote seleccionado */}
        {hasActiveFilter && (
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight dark:text-gray-300">
              Estado
            </label>
            <Select value={selectValueEstado} onValueChange={(value) => handleEstadoChange(value === 'todos-estados' ? null : value)}>
              <SelectTrigger className="h-9 w-full text-sm border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
                <SelectItem value="todos-estados">Todos los estados</SelectItem>
                {opciones?.estados?.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Info del lote seleccionado */}
      {loteSeleccionado && (
        <div className="flex items-center justify-between gap-4 text-xs text-segal-dark/70 dark:text-gray-400 bg-segal-blue/5 px-3 py-2 rounded-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <FileStack className="h-3.5 w-3.5" />
              <span>{loteSeleccionado.total_archivos} {loteSeleccionado.total_archivos === 1 ? 'archivo' : 'archivos'}</span>
            </div>
            <div className="h-3 w-px bg-segal-dark/20"></div>
            <div>
              <span className="font-medium text-segal-blue">{formatNumber(loteSeleccionado.total_prospectos)}</span> prospectos cargados
            </div>
            <div className="h-3 w-px bg-segal-dark/20"></div>
            {loteSeleccionado.estado === 'procesando' && (
              <div className="flex items-center gap-1.5 text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Procesando...</span>
              </div>
            )}
            {loteSeleccionado.estado === 'abierto' && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Importando...</span>
              </div>
            )}
            {loteSeleccionado.estado === 'completado' && (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Completado</span>
              </div>
            )}
            {loteSeleccionado.estado === 'fallido' && (
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>Error</span>
              </div>
            )}
          </div>
          
          {/* Botón eliminar carga */}
          {onDeleteLote && loteSeleccionado.estado !== 'procesando' && loteSeleccionado.estado !== 'abierto' && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isDeletingLote}
                >
                  {isDeletingLote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5">Eliminar carga</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white dark:bg-slate-900">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-segal-dark dark:text-white">
                    ¿Eliminar carga?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-segal-dark/70 dark:text-white/70">
                    Estás por eliminar la carga <span className="font-semibold">"{loteSeleccionado.nombre}"</span>.
                    {loteSeleccionado.total_prospectos > 0 && (
                      <span className="block mt-2 text-red-600">
                        Se eliminarán {formatNumber(loteSeleccionado.total_prospectos)} prospectos.
                      </span>
                    )}
                    <span className="block mt-2">Esta acción no se puede deshacer.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDeleteLote(loteSeleccionado.id)
                      setDeleteDialogOpen(false)
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Segunda fila: Tipo + Búsqueda (solo si hay filtro activo) */}
      {hasActiveFilter && (
        <div className="flex gap-3">
          {/* Filtro Tipo de Deuda */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight dark:text-gray-300">
              Tipo de Deuda
            </label>
            <Select value={selectValueTipo} onValueChange={(value) => handleTipoChange(value === 'todos-tipos' ? null : value)}>
              <SelectTrigger className="h-9 w-full text-sm border-segal-blue/30 bg-white focus:border-segal-blue focus:ring-segal-blue/20 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-segal-blue/20 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20">
                <SelectItem value="todos-tipos">Todos los tipos</SelectItem>
                {opciones?.tipos_prospecto?.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-segal-dark mb-1.5 uppercase tracking-tight dark:text-gray-300">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-segal-dark/40" />
              <Input
                placeholder="Nombre, email o teléfono..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isSearchDisabled}
                className="h-10 w-full pl-9 text-sm border-segal-blue/20 focus:border-segal-blue focus:ring-segal-blue/20 bg-white disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-segal-blue dark:focus:ring-segal-blue/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
