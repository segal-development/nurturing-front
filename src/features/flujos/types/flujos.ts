/**
 * Tipos locales para la feature de Flujos
 * Estos tipos son específicos para la gestión de filtros y UI
 */

import type { FlujoNurturing } from '@/types/flujo'

export interface FiltrosState {
  origenId: string | null
  tipoDeudor: string | null
}

export interface OrigenFlujo {
  id: string
  nombre: string
  total_flujos: number
}

export interface OpcionesFlujos {
  origenes: OrigenFlujo[]
  tipos_deudor: Array<{ value: string; label: string }>
}

export interface FlujosTableProps {
  flujos: FlujoNurturing[]
  isLoading: boolean
  onViewFlujo?: (id: number) => void
  onEditFlujo?: (id: number) => void
  onDeleteFlujo?: (id: number) => void
  onEjecutarFlujo?: (flujoId: number) => void
}

export interface FlujosFiltersProps {
  filtros: FiltrosState
  opciones: OpcionesFlujos | undefined
  onFiltrosChange: (filtros: FiltrosState) => void
}

export interface FlujosSearchProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export interface FlujosPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
