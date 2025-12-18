/**
 * Execution State Helpers
 * 
 * Shared utilities for displaying execution and stage states.
 * Centralizes styling, icons, and labels for execution states.
 * 
 * @module executionStateHelpers
 */

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { FlowExecutionMainState, StageExecutionState } from '@/types/flowExecutionTracking'

// ============================================================================
// Types
// ============================================================================

type ExecutionState = FlowExecutionMainState | StageExecutionState | string

interface StateConfig {
  color: string
  label: string
  icon: (size: string) => ReactNode
}

// ============================================================================
// State Configuration Map
// ============================================================================

const STATE_CONFIG: Record<string, StateConfig> = {
  // Completed states
  completado: {
    color: 'bg-green-50 border-green-200 text-green-700',
    label: 'Completada',
    icon: (size) => <CheckCircle2 className={size} />,
  },
  completed: {
    color: 'bg-green-50 border-green-200 text-green-700',
    label: 'Completada',
    icon: (size) => <CheckCircle2 className={size} />,
  },
  
  // In progress states
  en_progreso: {
    color: 'bg-blue-50 border-blue-200 text-blue-600',
    label: 'En Progreso',
    icon: (size) => <Loader2 className={`${size} animate-spin`} />,
  },
  in_progress: {
    color: 'bg-blue-50 border-blue-200 text-blue-600',
    label: 'En Progreso',
    icon: (size) => <Loader2 className={`${size} animate-spin`} />,
  },
  executing: {
    color: 'bg-amber-50 border-amber-200 text-amber-600',
    label: 'Ejecutando',
    icon: (size) => <Loader2 className={`${size} animate-spin`} />,
  },
  
  // Paused states
  pausado: {
    color: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    label: 'Pausado',
    icon: (size) => <Pause className={size} />,
  },
  paused: {
    color: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    label: 'Pausado',
    icon: (size) => <Pause className={size} />,
  },
  
  // Failed states
  fallido: {
    color: 'bg-red-50 border-red-200 text-red-600',
    label: 'Fallido',
    icon: (size) => <XCircle className={size} />,
  },
  failed: {
    color: 'bg-red-50 border-red-200 text-red-600',
    label: 'Fallido',
    icon: (size) => <XCircle className={size} />,
  },
  
  // Cancelled state
  cancelled: {
    color: 'bg-gray-50 border-gray-200 text-gray-600',
    label: 'Cancelado',
    icon: (size) => <XCircle className={size} />,
  },
  
  // Pending state
  pending: {
    color: 'bg-slate-50 border-slate-200 text-slate-500',
    label: 'Pendiente',
    icon: (size) => <Clock className={size} />,
  },
}

const DEFAULT_CONFIG: StateConfig = {
  color: 'bg-segal-blue/5 border-segal-blue/10 text-segal-dark',
  label: 'Desconocido',
  icon: (size) => <AlertCircle className={size} />,
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the CSS classes for a given execution state
 */
export function getExecutionStateColor(estado: ExecutionState): string {
  return STATE_CONFIG[estado]?.color ?? DEFAULT_CONFIG.color
}

/**
 * Get the icon component for a given execution state
 * 
 * @param estado - The execution state
 * @param size - Tailwind size classes (default: 'h-5 w-5')
 */
export function getExecutionStateIcon(estado: ExecutionState, size = 'h-5 w-5'): ReactNode {
  const config = STATE_CONFIG[estado] ?? DEFAULT_CONFIG
  return config.icon(size)
}

/**
 * Get the human-readable label for a given execution state
 */
export function getExecutionStateLabel(estado: ExecutionState): string {
  return STATE_CONFIG[estado]?.label ?? DEFAULT_CONFIG.label
}

/**
 * Get all state configuration at once
 */
export function getExecutionStateConfig(estado: ExecutionState): StateConfig {
  return STATE_CONFIG[estado] ?? DEFAULT_CONFIG
}

// ============================================================================
// Date Formatting Helpers
// ============================================================================

/**
 * Format a date string for display
 * 
 * @param fecha - ISO date string or undefined
 * @returns Formatted date string or '---' if invalid
 */
export function formatExecutionDate(fecha: string | undefined): string {
  if (!fecha) return '---'
  
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '---'
  
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate duration between two dates
 * 
 * @param inicio - Start date ISO string
 * @param fin - End date ISO string (optional, defaults to now)
 * @returns Human-readable duration string
 */
export function calculateExecutionDuration(inicio: string | undefined, fin?: string): string {
  if (!inicio) return '---'
  
  const fechaInicio = new Date(inicio)
  if (Number.isNaN(fechaInicio.getTime())) return '---'
  
  const fechaFin = fin ? new Date(fin) : new Date()
  if (Number.isNaN(fechaFin.getTime())) return '---'
  
  const duracionMs = fechaFin.getTime() - fechaInicio.getTime()
  
  if (duracionMs < 0) return '---'
  if (duracionMs < 1000) return '< 1m'
  
  const minutos = Math.floor(duracionMs / 60000)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)
  
  if (dias > 0) return `${dias}d ${horas % 24}h`
  if (horas > 0) return `${horas}h ${minutos % 60}m`
  if (minutos > 0) return `${minutos}m`
  return '< 1m'
}
