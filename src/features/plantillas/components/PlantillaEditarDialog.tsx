/**
 * Dialog para editar una plantilla existente
 * Permite modificar SMS y Email plantillas
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
import { SMSTemplateEditor } from './SMSTemplateEditor'
import { EmailTemplateEditor } from './EmailTemplateEditor'
import { plantillasService } from '@/api/plantillas.service'
import { plantillaSMSSchema, plantillaEmailSchema, type PlantillaSMSFormData, type PlantillaEmailFormData } from '../schemas/plantillaSchemas'
import { useQueryClient } from '@tanstack/react-query'
import type { AnyPlantilla, PlantillaSMS, PlantillaEmail } from '@/types/plantilla'

interface PlantillaEditarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantilla?: AnyPlantilla
}

export function PlantillaEditarDialog({
  open,
  onOpenChange,
  plantilla,
}: PlantillaEditarDialogProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Estado para plantilla SMS
  const [plantillaSMS, setPlantillaSMS] = useState<PlantillaSMSFormData>({
    nombre: '',
    descripcion: '',
    tipo: 'sms',
    activo: true,
    contenido: '',
  })

  // Estado para plantilla Email
  const [plantillaEmail, setPlantillaEmail] = useState<PlantillaEmailFormData>({
    nombre: '',
    descripcion: '',
    tipo: 'email',
    activo: true,
    asunto: '',
    componentes: [],
  })

  // Cargar datos cuando abre el diálogo
  useEffect(() => {
    if (!open || !plantilla) return

    setIsLoading(true)
    try {
      if (plantilla.tipo === 'sms') {
        const sms = plantilla as PlantillaSMS
        setPlantillaSMS({
          nombre: sms.nombre,
          descripcion: sms.descripcion || '',
          tipo: 'sms',
          activo: sms.activo,
          contenido: sms.contenido,
        })
      } else {
        const email = plantilla as PlantillaEmail
        setPlantillaEmail({
          nombre: email.nombre,
          descripcion: email.descripcion || '',
          tipo: 'email',
          activo: email.activo,
          asunto: email.asunto,
          componentes: email.componentes as any,
        })
      }
    } catch (error) {
      console.error('Error loading plantilla:', error)
      toast.error('Error al cargar la plantilla')
    } finally {
      setIsLoading(false)
    }
  }, [open, plantilla])

  const handleGuardar = async () => {
    if (!plantilla?.id) return

    setIsSaving(true)
    try {
      if (plantilla.tipo === 'sms') {
        const validatedData = plantillaSMSSchema.parse(plantillaSMS)
        await plantillasService.actualizar(plantilla.id, {
          ...validatedData,
        })
      } else {
        const validatedData = plantillaEmailSchema.parse(plantillaEmail)
        await plantillasService.actualizar(plantilla.id, {
          ...validatedData,
        })
      }

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['plantillas'] })

      toast.success(`Plantilla actualizada correctamente`)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error al guardar plantilla:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido'
      toast.error(`Error al guardar: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Validar que el formulario esté completo
  const esValido = (() => {
    try {
      if (plantilla?.tipo === 'sms') {
        plantillaSMSSchema.parse(plantillaSMS)
        return true
      } else {
        plantillaEmailSchema.parse(plantillaEmail)
        return true
      }
    } catch {
      return false
    }
  })()

  if (!plantilla) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plantilla</DialogTitle>
          <DialogDescription>
            {plantilla.tipo === 'sms'
              ? 'Edita tu plantilla de SMS con máximo 160 caracteres'
              : 'Edita tu plantilla de Email con componentes personalizables'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
          </div>
        ) : (
          <>
            {/* Editor SMS */}
            {plantilla.tipo === 'sms' && (
              <SMSTemplateEditor
                initialData={plantillaSMS}
                onDataChange={setPlantillaSMS}
              />
            )}

            {/* Editor Email */}
            {plantilla.tipo === 'email' && (
              <EmailTemplateEditor
                initialData={plantillaEmail}
                onDataChange={setPlantillaEmail}
              />
            )}
          </>
        )}

        <DialogFooter className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={!esValido || isSaving || isLoading}
            className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
