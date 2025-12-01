/**
 * Tipos locales para la feature de Prospectos
 * Estos tipos son específicos para la gestión de filtros y UI
 */

export interface FiltrosState {
  importacionId: number | null
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

export interface OpcionesFiltrado {
  importaciones: Importacion[]
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
