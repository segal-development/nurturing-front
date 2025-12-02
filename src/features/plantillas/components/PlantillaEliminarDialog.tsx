/**
 * Dialog de confirmación para eliminar una plantilla
 */

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { plantillasService } from '@/api/plantillas.service'
import type { AnyPlantilla } from '@/types/plantilla'
import { useQueryClient } from '@tanstack/react-query'

interface PlantillaEliminarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantilla?: AnyPlantilla
}

export function PlantillaEliminarDialog({
  open,
  onOpenChange,
  plantilla,
}: PlantillaEliminarDialogProps) {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEliminar = async () => {
    if (!plantilla?.id) return

    setIsDeleting(true)
    try {
      await plantillasService.eliminar(plantilla.id)

      // Invalidar cache para recargar la tabla
      queryClient.invalidateQueries({ queryKey: ['plantillas'] })

      toast.success(`Plantilla "${plantilla.nombre}" eliminada exitosamente`)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error eliminando plantilla:', error)
      const mensaje = error.response?.data?.message || error.message || 'Error desconocido'
      toast.error(`Error al eliminar: ${mensaje}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Eliminar Plantilla</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ¿Estás seguro de que deseas eliminar la plantilla{' '}
              <span className="font-semibold">"{plantilla?.nombre}"</span>?
            </p>
          </div>

          <p className="text-sm text-segal-dark/70">
            Una vez eliminada, no podrás recuperar esta plantilla. Si aún la necesitas, considera duplicarla antes.
          </p>
        </div>

        <DialogFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEliminar}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar Plantilla'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
