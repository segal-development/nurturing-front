/**
 * EnvioDetailDialog Component
 * Modal dialog for displaying detailed information about a shipment
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { EnvioDetail } from './EnvioDetail'

interface EnvioDetailDialogProps {
  envioId: number | null
  isOpen: boolean
  onClose: () => void
}

export function EnvioDetailDialog({ envioId, isOpen, onClose }: EnvioDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Detalle de Envío</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            {envioId && `ID: ${envioId}`}
          </DialogDescription>
        </DialogHeader>

        {envioId && <EnvioDetail envioId={envioId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

export default EnvioDetailDialog
