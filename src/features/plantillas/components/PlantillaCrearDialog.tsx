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
import { EmailTemplateBuilder } from './EmailTemplates'
import { plantillasService } from '@/api/plantillas.service'
import { plantillaSMSSchema, plantillaEmailSchema, type PlantillaSMSFormData, type PlantillaEmailFormData } from '../schemas/plantillaSchemas'
import { useQueryClient } from '@tanstack/react-query'
import type { EmailBlockData } from './EmailTemplates'
import { exportEmailForBackend } from '../utils/emailRenderer'

interface PlantillaCrearDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoInicial?: 'sms' | 'email'
  modoEmailInicial?: 'modular' | 'avanzado'
}

export function PlantillaCrearDialog({
  open,
  onOpenChange,
  tipoInicial = 'sms',
  modoEmailInicial = 'modular',
}: PlantillaCrearDialogProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [tipo, setTipo] = useState<'sms' | 'email'>(tipoInicial)
  const [modoEmail, setModoEmail] = useState<'modular' | 'avanzado'>(modoEmailInicial)

  // Estado para plantilla SMS
  const [plantillaSMS, setPlantillaSMS] = useState<PlantillaSMSFormData>({
    nombre: '',
    descripcion: '',
    tipo: 'sms',
    activo: true,
    contenido: '',
  })

  // Estado para plantilla Email Modular
  const [plantillaEmail, setPlantillaEmail] = useState<PlantillaEmailFormData>({
    nombre: '',
    descripcion: '',
    tipo: 'email',
    activo: true,
    asunto: '',
    componentes: [],
  })

  // Estado para plantilla Email Avanzado (react-email)
  const [plantillaEmailAvanzada, setPlantillaEmailAvanzada] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'email',
    formato: 'bloques',
    activo: true,
    bloques: [] as EmailBlockData[],
    html: '',
  })

  const handleGuardar = useCallback(async () => {
    setIsSaving(true)
    try {
      if (tipo === 'sms') {
        // Validar antes de enviar
        const validatedData = plantillaSMSSchema.parse(plantillaSMS)
        await plantillasService.crearPlantillaSMS(validatedData)
      } else if (tipo === 'email') {
        if (modoEmail === 'modular') {
          // Validar antes de enviar
          const validatedData = plantillaEmailSchema.parse(plantillaEmail)

          console.log('🆕 [PlantillaCrearDialog] Creando plantilla email modular')
          console.log('📤 [PlantillaCrearDialog] Componentes que se enviarán:', validatedData.componentes)

          await plantillasService.crearPlantillaEmail(validatedData)
        } else {
          // Email Avanzado con react-email
          if (!plantillaEmailAvanzada.nombre || plantillaEmailAvanzada.bloques.length === 0) {
            toast.error('Por favor ingresa un nombre y al menos un bloque')
            setIsSaving(false)
            return
          }

          // Exportar bloques a HTML
          const exported = exportEmailForBackend(plantillaEmailAvanzada.bloques, {
            subject: plantillaEmailAvanzada.nombre,
          })

          // Enviar al backend
          await plantillasService.crearPlantillaEmail({
            nombre: plantillaEmailAvanzada.nombre,
            descripcion: plantillaEmailAvanzada.descripcion,
            tipo: 'email',
            activo: plantillaEmailAvanzada.activo,
            asunto: plantillaEmailAvanzada.nombre,
            componentes: [
              {
                id: 'avanzado-html',
                tipo: 'html-avanzado',
                orden: 0,
                contenido: {
                  html: exported.html,
                  bloques: exported.blocksJSON,
                } as any,
              },
            ] as any,
          })
        }
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
      setPlantillaEmailAvanzada({
        nombre: '',
        descripcion: '',
        tipo: 'email',
        formato: 'bloques',
        activo: true,
        bloques: [],
        html: '',
      })
      setTipo('sms')
      setModoEmail('modular')
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
      } else if (tipo === 'email') {
        if (modoEmail === 'modular') {
          plantillaEmailSchema.parse(plantillaEmail)
          return true
        } else {
          return plantillaEmailAvanzada.nombre && plantillaEmailAvanzada.bloques.length > 0
        }
      }
      return false
    } catch {
      return false
    }
  }, [tipo, modoEmail, plantillaSMS, plantillaEmail, plantillaEmailAvanzada])()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Plantilla</DialogTitle>
          <DialogDescription>
            {tipo === 'sms'
              ? 'Crea una plantilla de SMS con máximo 160 caracteres'
              : modoEmail === 'modular'
              ? 'Crea una plantilla de Email con componentes (Logo, Texto, Botón, etc)'
              : 'Crea una plantilla de Email avanzada con bloques personalizables'}
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

        {/* Selector de modo Email */}
        {tipo === 'email' && !plantillaEmail.nombre && !plantillaEmailAvanzada.nombre && (
          <div className="grid grid-cols-2 gap-4 my-6">
            <button
              onClick={() => setModoEmail('modular')}
              className={`p-4 rounded-lg border-2 transition-all ${
                modoEmail === 'modular'
                  ? 'border-segal-blue bg-segal-blue/10'
                  : 'border-segal-blue/20 hover:border-segal-blue/40'
              }`}
            >
              <p className="font-semibold text-segal-dark text-lg mb-1">🧩 Email Modular</p>
              <p className="text-sm text-segal-dark/60">Logo, Texto, Botón, etc</p>
            </button>
            <button
              onClick={() => setModoEmail('avanzado')}
              className={`p-4 rounded-lg border-2 transition-all ${
                modoEmail === 'avanzado'
                  ? 'border-segal-blue bg-segal-blue/10'
                  : 'border-segal-blue/20 hover:border-segal-blue/40'
              }`}
            >
              <p className="font-semibold text-segal-dark text-lg mb-1">⚡ Email Avanzado</p>
              <p className="text-sm text-segal-dark/60">Bloques personalizables</p>
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

        {/* Editor Email Modular */}
        {tipo === 'email' && modoEmail === 'modular' && (
          <EmailTemplateEditor
            initialData={plantillaEmail}
            onDataChange={setPlantillaEmail}
          />
        )}

        {/* Editor Email Avanzado */}
        {tipo === 'email' && modoEmail === 'avanzado' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-segal-dark">Nombre de la Plantilla</label>
              <input
                type="text"
                value={plantillaEmailAvanzada.nombre}
                onChange={(e) =>
                  setPlantillaEmailAvanzada({ ...plantillaEmailAvanzada, nombre: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                placeholder="Ej: Newsletter Mensual"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-segal-dark">Descripción (Opcional)</label>
              <textarea
                value={plantillaEmailAvanzada.descripcion}
                onChange={(e) =>
                  setPlantillaEmailAvanzada({ ...plantillaEmailAvanzada, descripcion: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 resize-none h-20"
                placeholder="Describe para qué sirve esta plantilla..."
              />
            </div>

            <EmailTemplateBuilder
              initialBlocks={plantillaEmailAvanzada.bloques}
              onChange={(blocks, html) => {
                setPlantillaEmailAvanzada({
                  ...plantillaEmailAvanzada,
                  bloques: blocks,
                  html: html,
                })
              }}
              showPreview={true}
              config={{
                subject: plantillaEmailAvanzada.nombre || 'Email Template',
                headerText: 'Email Template',
              }}
            />
          </div>
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
