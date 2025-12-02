/**
 * Dialog para editar flujos con canvas visual (ReactFlow)
 * Reemplaza el EditFlujoDialog tradicional con una experiencia visual tipo constructor
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditFlujoBuilder } from '../EditFlujoBuilder/EditFlujoBuilder'
import type { FlujoNurturing } from '@/types/flujo'

interface EditFlujoBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujo: FlujoNurturing | null
}

export function EditFlujoBuilderDialog({
  open,
  onOpenChange,
  flujo,
}: EditFlujoBuilderDialogProps) {
  if (!flujo) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[95vh] bg-white border border-segal-blue/20 shadow-2xl overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="border-b border-segal-blue/10 pb-4 px-6 pt-6 shrink-0">
          <DialogTitle className="text-2xl font-bold text-segal-dark">
            Editar Flujo: {flujo.nombre}
          </DialogTitle>
          <DialogDescription className="text-segal-dark/70">
            Modifica la estructura visual del flujo, agregando, editando o eliminando nodos y conexiones
          </DialogDescription>
        </DialogHeader>

        {/* FlowBuilder Content */}
        <div className="flex-1 overflow-hidden">
          <EditFlujoBuilder
            flujo={flujo}
            onCancel={() => onOpenChange(false)}
            onSaveSuccess={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
