/**
 * Tipos locales para la feature de Prospectos
 * Estos tipos son específicos para la gestión de filtros y UI
 */

export interface FiltrosState {
  loteId: number | null  // Cambiado de importacionId a loteId
  importacionId: number | null  // Mantener para compatibilidad
  estado: string | null
  tipoProspectoId: number | null
}

export interface Importacion {
  id: number
  nombre_archivo: string
  origen: string
  total_prospectos: number
  fecha_importacion: string
}

// Nuevo tipo para lotes
export interface LoteOpcion {
  id: number
  nombre: string
  estado: 'abierto' | 'procesando' | 'completado' | 'fallido'
  total_archivos: number
  total_prospectos: number
  total_registros: number
  registros_exitosos: number
  nuevos_ultimo_sync?: number
  created_at: string
  importaciones: Array<{
    id: number
    nombre_archivo: string
    estado: string
    total_prospectos: number
  }>
}

export interface OpcionesFiltrado {
  lotes: LoteOpcion[]  // Nuevo: lista de lotes
  importaciones?: Importacion[]  // Opcional: mantener compatibilidad
  estados: Array<{ value: string; label: string }>
  tipos_prospecto: Array<{ id: number; nombre: string }>
}

export interface ProspectosTableProps {
  prospectos: Prospecto[]
  isLoading: boolean
  onViewProspecto?: (id: number) => void
}

export interface ProspectosFiltersProps {
  filtros: FiltrosState
  opciones: OpcionesFiltrado | undefined
  isLoading: boolean
  onFiltrosChange: (filtros: FiltrosState) => void
}

export interface ProspectosSearchProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export interface ProspectosPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface ProspectosUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export interface Prospecto {
  id: number
  nombre: string
  email: string
  telefono?: string
  rut?: string
  monto_deuda: number
  estado: string
  tipo_prospecto_id?: number
  fecha_ultimo_contacto?: string
  url_informe?: string
}
