/**
 * Dialogo para cargar prospectos desde Excel
 * 
 * Maneja el cierre del modal:
 * - BLOQUEA el cierre mientras hay una importacion procesando
 * - Muestra confirmacion si el lote esta en estado "procesando" pero no hay archivo activo
 */

import { useState, useCallback, useMemo } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { UploadExcel } from '@/components/prospectos/UploadExcel'
import { useLoteStore, selectHayLoteActivo } from '@/stores/loteStore'
import { useImportacionStore } from '@/stores/importacionStore'
import type { ProspectosUploadDialogProps } from '../../types/prospectos'

export function ProspectosUploadDialog({ open, onOpenChange, onSuccess }: ProspectosUploadDialogProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const hayLoteActivo = useLoteStore(selectHayLoteActivo)
  const loteActivo = useLoteStore(state => state.loteActivo)
  const importacionActiva = useImportacionStore(state => state.importacionActiva)

  // Determinar si hay una importacion activamente procesando
  const hayImportacionProcesando = useMemo(() => {
    // Revisar si hay importacion individual procesando
    if (importacionActiva && ['pendiente', 'procesando'].includes(importacionActiva.estado)) {
      return true
    }
    // Revisar si hay archivos procesando en el lote
    if (loteActivo?.archivos?.some(a => ['pendiente', 'procesando'].includes(a.estado))) {
      return true
    }
    return false
  }, [importacionActiva, loteActivo])

  // Manejar intento de cierre del modal
  const handleOpenChange = useCallback((newOpen: boolean) => {
    // Si intenta cerrar y hay importacion procesando, BLOQUEAR completamente
    if (!newOpen && hayImportacionProcesando) {
      // No hacer nada - el modal no se puede cerrar
      return
    }

    // Si intenta cerrar y hay un lote activo (pero no procesando), mostrar confirmacion
    if (!newOpen && hayLoteActivo && loteActivo?.estado === 'procesando') {
      setShowConfirmClose(true)
      return
    }
    
    // Si no hay lote activo o esta completado, cerrar normalmente
    onOpenChange(newOpen)
  }, [hayImportacionProcesando, hayLoteActivo, loteActivo?.estado, onOpenChange])

  // Confirmar cierre forzado
  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false)
    onOpenChange(false)
  }, [onOpenChange])

  // Cancelar cierre
  const handleCancelClose = useCallback(() => {
    setShowConfirmClose(false)
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="bg-segal-blue hover:bg-segal-blue/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
            <Upload className="mr-2 h-4 w-4" />
            Cargar Excel
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="w-[60vw] bg-white border border-segal-blue/20 shadow-2xl"
          // Deshabilitar cierre por Escape y click en overlay mientras procesa
          onEscapeKeyDown={hayImportacionProcesando ? (e) => e.preventDefault() : undefined}
          onPointerDownOutside={hayImportacionProcesando ? (e) => e.preventDefault() : undefined}
          onInteractOutside={hayImportacionProcesando ? (e) => e.preventDefault() : undefined}
          // Ocultar boton de cerrar mientras procesa
          showCloseButton={!hayImportacionProcesando}
        >
          <DialogHeader className="border-b border-segal-blue/10 pb-4">
            <DialogTitle className="text-2xl font-bold text-segal-dark">
              Cargar Prospectos desde Excel
            </DialogTitle>
            <DialogDescription className="text-segal-dark/70">
              Sube un archivo Excel con tus prospectos. El archivo debe contener columnas para nombre, RUT, email, teléfono y monto de deuda.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-4">
            <UploadExcel onSuccess={onSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para cerrar con lote activo */}
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-segal-dark">¿Cerrar mientras se procesa?</AlertDialogTitle>
            <AlertDialogDescription className="text-segal-dark/70">
              Hay un archivo procesándose en "{loteActivo?.nombre}". 
              El procesamiento continuará en segundo plano, pero perderás el progreso visual.
              <br /><br />
              <strong className="text-segal-dark">Tip:</strong> Esperá a que termine para agregar más archivos o finalizar la carga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose} className="border-segal-blue text-segal-blue hover:bg-segal-blue/5">
              Seguir esperando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-segal-red hover:bg-segal-red/90 text-white">
              Cerrar de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
