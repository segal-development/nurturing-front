/**
 * Dialog de confirmación para cancelar ejecución de flujo
 * Usa shadcn AlertDialog para una mejor UX
 *
 * @module CancelExecutionDialog
 */

import { AlertTriangle, Loader2, XCircle } from 'lucide-react'

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

// ============================================================================
// Types
// ============================================================================

interface CancelExecutionDialogProps {
  /** Controla si el dialog está abierto */
  isOpen: boolean
  /** Callback cuando cambia el estado de apertura */
  onOpenChange: (open: boolean) => void
  /** Callback cuando se confirma la cancelación */
  onConfirm: () => void
  /** Indica si está procesando la cancelación */
  isLoading: boolean
  /** Nombre del flujo (opcional, para mejor UX) */
  flujoNombre?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog de confirmación para cancelar una ejecución de flujo.
 * Muestra advertencia sobre las consecuencias de cancelar.
 *
 * @example
 * ```tsx
 * <CancelExecutionDialog
 *   isOpen={showCancelDialog}
 *   onOpenChange={setShowCancelDialog}
 *   onConfirm={handleCancel}
 *   isLoading={isCanceling}
 *   flujoNombre="Mi Flujo"
 * />
 * ```
 */
export function CancelExecutionDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading,
  flujoNombre,
}: CancelExecutionDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border-red-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-segal-dark">
              Cancelar Ejecución
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-segal-dark/70 space-y-3">
            <p>
              ¿Estás seguro de que deseas cancelar{' '}
              {flujoNombre ? (
                <>
                  la ejecución del flujo <strong className="text-segal-dark">{flujoNombre}</strong>
                </>
              ) : (
                'esta ejecución'
              )}
              ?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-red-700 mb-1">Esta acción:</p>
              <ul className="text-red-600 space-y-1 ml-4 list-disc">
                <li>Detendrá todos los envíos pendientes</li>
                <li>No se podrá reanudar después</li>
                <li>Los envíos ya realizados no se verán afectados</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5"
          >
            No, mantener ejecución
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Sí, cancelar ejecución
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
