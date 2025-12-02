/**
 * Dialog para crear una nueva plantilla
 * Permite elegir entre SMS y Email, y abre el editor correspondiente
 */

import { useState, useCallback } from 'react'
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

interface PlantillaCrearDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoInicial?: 'sms' | 'email'
}

export function PlantillaCrearDialog({
  open,
  onOpenChange,
  tipoInicial = 'sms',
}: PlantillaCrearDialogProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [tipo, setTipo] = useState<'sms' | 'email'>(tipoInicial)

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

  const handleGuardar = useCallback(async () => {
    setIsSaving(true)
    try {
      if (tipo === 'sms') {
        // Validar antes de enviar
        const validatedData = plantillaSMSSchema.parse(plantillaSMS)
        await plantillasService.crearPlantillaSMS(validatedData)
      } else {
        // Validar antes de enviar
        const validatedData = plantillaEmailSchema.parse(plantillaEmail)
        await plantillasService.crearPlantillaEmail(validatedData)
      }

      // Invalidar cache para recargar la tabla
      queryClient.invalidateQueries({ queryKey: ['plantillas'] })

      // Mostrar éxito con toast
      toast.success(`Plantilla ${tipo.toUpperCase()} creada exitosamente`)
      onOpenChange(false)

      // Resetear formularios
      setPlantillaSMS({
        nombre: '',
        descripcion: '',
        tipo: 'sms',
        activo: true,
        contenido: '',
      })
      setPlantillaEmail({
        nombre: '',
        descripcion: '',
        tipo: 'email',
        activo: true,
        asunto: '',
        componentes: [],
      })
    } catch (error: any) {
      console.error('Error al crear plantilla:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido'
      toast.error(`Error al crear plantilla: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }, [tipo, plantillaSMS, plantillaEmail, queryClient, onOpenChange])

  // Validar que el formulario esté completo usando Zod
  const esValido = useCallback(() => {
    try {
      if (tipo === 'sms') {
        plantillaSMSSchema.parse(plantillaSMS)
        return true
      } else {
        plantillaEmailSchema.parse(plantillaEmail)
        return true
      }
    } catch {
      return false
    }
  }, [tipo, plantillaSMS, plantillaEmail])()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Plantilla</DialogTitle>
          <DialogDescription>
            {tipo === 'sms'
              ? 'Crea una plantilla de SMS con máximo 160 caracteres'
              : 'Crea una plantilla de Email con componentes personalizables'}
          </DialogDescription>
        </DialogHeader>

        {/* Selector de tipo (solo al inicio) */}
        {!plantillaSMS.nombre && !plantillaEmail.nombre && (
          <div className="grid grid-cols-2 gap-4 my-6">
            <button
              onClick={() => setTipo('sms')}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipo === 'sms'
                  ? 'border-segal-blue bg-segal-blue/10'
                  : 'border-segal-blue/20 hover:border-segal-blue/40'
              }`}
            >
              <p className="font-semibold text-segal-dark text-lg mb-1">📱 SMS</p>
              <p className="text-sm text-segal-dark/60">Máx 160 caracteres</p>
            </button>
            <button
              onClick={() => setTipo('email')}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipo === 'email'
                  ? 'border-segal-blue bg-segal-blue/10'
                  : 'border-segal-blue/20 hover:border-segal-blue/40'
              }`}
            >
              <p className="font-semibold text-segal-dark text-lg mb-1">📧 Email</p>
              <p className="text-sm text-segal-dark/60">Con componentes</p>
            </button>
          </div>
        )}

        {/* Editor SMS */}
        {tipo === 'sms' && (
          <SMSTemplateEditor
            initialData={plantillaSMS}
            onDataChange={setPlantillaSMS}
          />
        )}

        {/* Editor Email */}
        {tipo === 'email' && (
          <EmailTemplateEditor
            initialData={plantillaEmail}
            onDataChange={setPlantillaEmail}
          />
        )}

        <DialogFooter className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={!esValido || isSaving}
            className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Crear Plantilla'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
