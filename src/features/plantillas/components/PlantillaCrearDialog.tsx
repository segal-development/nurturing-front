/**
 * Dialog para crear una nueva plantilla
 * Permite elegir entre SMS y Email, y abre el editor correspondiente
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
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

  const handleGuardar = async () => {
    setIsSaving(true)
    try {
      if (tipo === 'sms') {
        // Validar antes de enviar
        const validatedData = plantillaSMSSchema.parse(plantillaSMS)
        await plantillasService.crearPlantillaSMS(validatedData)
      } else if (tipo === 'email') {
        // Validar antes de enviar
        const validatedData = plantillaEmailSchema.parse(plantillaEmail)

        logger.log('[PlantillaCrearDialog] Creando plantilla email')
        logger.log('[PlantillaCrearDialog] Componentes que se enviarán:', validatedData.componentes)

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
      setTipo('sms')
    } catch (error: any) {
      logger.error('Error al crear plantilla:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido'
      toast.error(`Error al crear plantilla: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Validar que el formulario esté completo usando Zod
  const esValido = (() => {
    try {
      if (tipo === 'sms') {
        plantillaSMSSchema.parse(plantillaSMS)
        return true
      } else if (tipo === 'email') {
        plantillaEmailSchema.parse(plantillaEmail)
        return true
      }
      return false
    } catch {
      return false
    }
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Plantilla</DialogTitle>
          <DialogDescription>
            {tipo === 'sms'
              ? 'Crea una plantilla de SMS con máximo 160 caracteres'
              : 'Crea una plantilla de Email con componentes (Logo, Texto, Botón, etc)'}
          </DialogDescription>
        </DialogHeader>

        {/* Selector de tipo (solo al inicio) */}
        {!plantillaSMS.nombre && !plantillaEmail.nombre && (
          <div className="grid grid-cols-2 gap-4 my-6">
            <button
              type="button"
              onClick={() => setTipo('sms')}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipo === 'sms'
                  ? 'border-segal-blue dark:border-segal-turquoise bg-segal-blue/10 dark:bg-segal-turquoise/10'
                  : 'border-segal-blue/20 dark:border-gray-600 hover:border-segal-blue/40 dark:hover:border-gray-500'
              }`}
            >
              <p className="font-semibold text-segal-dark dark:text-white text-lg mb-1">📱 SMS</p>
              <p className="text-sm text-segal-dark/60 dark:text-gray-400">Máx 160 caracteres</p>
            </button>
            <button
              type="button"
              onClick={() => setTipo('email')}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipo === 'email'
                  ? 'border-segal-blue dark:border-segal-turquoise bg-segal-blue/10 dark:bg-segal-turquoise/10'
                  : 'border-segal-blue/20 dark:border-gray-600 hover:border-segal-blue/40 dark:hover:border-gray-500'
              }`}
            >
              <p className="font-semibold text-segal-dark dark:text-white text-lg mb-1">📧 Email</p>
              <p className="text-sm text-segal-dark/60 dark:text-gray-400">Con componentes</p>
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
            className="border-segal-blue/20 dark:border-gray-600 text-segal-dark dark:text-gray-300 hover:bg-segal-blue/5 dark:hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={!esValido || isSaving}
            className="bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90 text-white dark:text-gray-900 disabled:opacity-50"
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
