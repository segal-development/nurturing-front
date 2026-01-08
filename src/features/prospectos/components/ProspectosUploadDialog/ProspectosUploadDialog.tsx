/**
 * Diálogo para cargar prospectos desde Excel
 * 
 * Maneja el cierre del modal con confirmación si hay un lote activo procesándose.
 */

import { useState, useCallback } from 'react'
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
import type { ProspectosUploadDialogProps } from '../../types/prospectos'

export function ProspectosUploadDialog({ open, onOpenChange, onSuccess }: ProspectosUploadDialogProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const hayLoteActivo = useLoteStore(selectHayLoteActivo)
  const loteActivo = useLoteStore(state => state.loteActivo)

  // Manejar intento de cierre del modal
  const handleOpenChange = useCallback((newOpen: boolean) => {
    // Si intenta cerrar y hay un lote activo procesando, mostrar confirmación
    if (!newOpen && hayLoteActivo && loteActivo?.estado === 'procesando') {
      setShowConfirmClose(true)
      return
    }
    
    // Si no hay lote activo o está completado, cerrar normalmente
    onOpenChange(newOpen)
  }, [hayLoteActivo, loteActivo?.estado, onOpenChange])

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
        <DialogContent className="w-[60vw] bg-white border border-segal-blue/20 shadow-2xl">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar mientras se procesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hay un archivo procesándose en "{loteActivo?.nombre}". 
              El procesamiento continuará en segundo plano, pero perderás el progreso visual.
              <br /><br />
              <strong>Tip:</strong> Esperá a que termine para agregar más archivos o finalizar la carga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              Seguir esperando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-segal-red hover:bg-segal-red/90">
              Cerrar de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
