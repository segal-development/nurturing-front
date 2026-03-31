/**
 * Modal for saving a template with name and description
 * Used when clicking "Guardar como Nueva" in the preview panel
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { TemplatePreview } from '../../types/chat'

interface SaveTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TemplatePreview
  isSaving?: boolean
  onSave: (nombre: string, descripcion: string) => Promise<void>
}

export function SaveTemplateModal({
  open,
  onOpenChange,
  template,
  isSaving = false,
  onSave,
}: SaveTemplateModalProps) {
  const [nombre, setNombre] = useState(template.nombre || '')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNombre(template.nombre || '')
      setDescripcion('')
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) {
      setError('El nombre es requerido')
      return
    }

    if (trimmedNombre.length > 100) {
      setError('El nombre no puede tener más de 100 caracteres')
      return
    }

    setError(null)
    
    try {
      await onSave(trimmedNombre, descripcion.trim())
      onOpenChange(false)
    } catch (err) {
      // Error is handled by parent component
    }
  }

  const isValid = nombre.trim().length > 0 && nombre.trim().length <= 100

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-segal-dark dark:text-white">
            Guardar Plantilla
          </DialogTitle>
          <DialogDescription className="text-segal-dark/60 dark:text-gray-400">
            Asignale un nombre a tu plantilla para poder encontrarla después
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre input */}
          <div className="space-y-2">
            <Label 
              htmlFor="template-name"
              className="text-sm font-semibold text-segal-dark dark:text-white"
            >
              Nombre de la Plantilla <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-name"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setError(null)
              }}
              placeholder="Ej: Recordatorio Deuda Baja"
              maxLength={100}
              disabled={isSaving}
              className={cn(
                'border-segal-blue/30 dark:border-gray-600',
                'focus:border-segal-blue dark:focus:border-segal-turquoise',
                'dark:bg-gray-800 dark:text-white',
                error && 'border-red-500 focus:border-red-500'
              )}
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {nombre.length}/100 caracteres
            </p>
          </div>

          {/* Descripcion input */}
          <div className="space-y-2">
            <Label 
              htmlFor="template-description"
              className="text-sm font-semibold text-segal-dark dark:text-white"
            >
              Descripción <span className="text-gray-400">(opcional)</span>
            </Label>
            <textarea
              id="template-description"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe para qué sirve esta plantilla..."
              rows={3}
              disabled={isSaving}
              className={cn(
                'w-full px-3 py-2 text-sm rounded-md resize-none',
                'border border-segal-blue/30 dark:border-gray-600',
                'focus:border-segal-blue dark:focus:border-segal-turquoise',
                'focus:outline-none focus:ring-1 focus:ring-segal-blue/20 dark:focus:ring-segal-turquoise/20',
                'dark:bg-gray-800 dark:text-white',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500'
              )}
            />
          </div>

          {/* Template summary */}
          <div className="p-3 rounded-lg bg-segal-blue/5 dark:bg-gray-700/50 border border-segal-blue/10 dark:border-gray-600">
            <p className="text-xs text-segal-dark/60 dark:text-gray-400 mb-1">
              Asunto del email:
            </p>
            <p className="text-sm font-medium text-segal-dark dark:text-white">
              {template.asunto || 'Sin asunto'}
            </p>
            <p className="text-xs text-segal-dark/60 dark:text-gray-400 mt-2">
              Componentes: {template.componentes.length}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="border-segal-blue/20 dark:border-gray-600 text-segal-dark dark:text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSaving}
              className={cn(
                'bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90',
                'text-white dark:text-gray-900',
                'disabled:opacity-50'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
