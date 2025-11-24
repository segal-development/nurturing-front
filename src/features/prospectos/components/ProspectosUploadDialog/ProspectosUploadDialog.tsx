/**
 * Diálogo para cargar prospectos desde Excel
 */

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
import { UploadExcel } from '@/components/prospectos/UploadExcel'
import type { ProspectosUploadDialogProps } from '../../types/prospectos'

export function ProspectosUploadDialog({ open, onOpenChange, onSuccess }: ProspectosUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  )
}
