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
import { EmailTemplateBuilder } from './EmailTemplates'
import { plantillasService } from '@/api/plantillas.service'
import { plantillaSMSSchema, plantillaEmailSchema, type PlantillaSMSFormData, type PlantillaEmailFormData } from '../schemas/plantillaSchemas'
import { useQueryClient } from '@tanstack/react-query'
import type { AnyPlantilla, PlantillaSMS, PlantillaEmail } from '@/types/plantilla'
import type { EmailBlockData } from './EmailTemplates'
import { exportEmailForBackend } from '../utils/emailRenderer'

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
  const [modoEmail, setModoEmail] = useState<'modular' | 'avanzado'>('modular')

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

  // Estado para plantilla Email Avanzado
  const [plantillaEmailAvanzada, setPlantillaEmailAvanzada] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'email',
    formato: 'bloques',
    activo: true,
    bloques: [] as EmailBlockData[],
    html: '',
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

        // Detectar si es email avanzado (tiene componente html-avanzado)
        const esAvanzado = email.componentes?.some(c => (c as any).tipo === 'html-avanzado')

        if (esAvanzado) {
          setModoEmail('avanzado')
          const componenteAvanzado = email.componentes?.find(c => (c as any).tipo === 'html-avanzado') as any
          const bloques = componenteAvanzado?.contenido?.bloques
            ? JSON.parse(typeof componenteAvanzado.contenido.bloques === 'string'
                ? componenteAvanzado.contenido.bloques
                : JSON.stringify(componenteAvanzado.contenido.bloques))
            : []

          setPlantillaEmailAvanzada({
            nombre: email.nombre,
            descripcion: email.descripcion || '',
            tipo: 'email',
            formato: 'bloques',
            activo: email.activo,
            bloques: bloques as EmailBlockData[],
            html: componenteAvanzado?.contenido?.html || '',
          })
        } else {
          setModoEmail('modular')
          setPlantillaEmail({
            nombre: email.nombre,
            descripcion: email.descripcion || '',
            tipo: 'email',
            activo: email.activo,
            asunto: email.asunto,
            componentes: email.componentes as any,
          })
        }
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
      } else if (modoEmail === 'modular') {
        const validatedData = plantillaEmailSchema.parse(plantillaEmail)

        console.log('✏️ [PlantillaEditarDialog] Actualizando plantilla email modular')
        console.log('📤 [PlantillaEditarDialog] Componentes que se enviarán:', validatedData.componentes)

        await plantillasService.actualizar(plantilla.id, {
          ...validatedData,
        })
      } else {
        // Email Avanzado
        const exported = exportEmailForBackend(plantillaEmailAvanzada.bloques, {
          subject: plantillaEmailAvanzada.nombre,
        })

        await plantillasService.actualizar(plantilla.id, {
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
              },
            },
          ] as any,
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
      } else if (modoEmail === 'modular') {
        plantillaEmailSchema.parse(plantillaEmail)
        return true
      } else {
        return plantillaEmailAvanzada.nombre && plantillaEmailAvanzada.bloques.length > 0
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
              : modoEmail === 'modular'
              ? 'Edita tu plantilla de Email con componentes'
              : 'Edita tu plantilla de Email avanzada con bloques'}
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

            {/* Editor Email Modular */}
            {plantilla.tipo === 'email' && modoEmail === 'modular' && (
              <EmailTemplateEditor
                initialData={plantillaEmail}
                onDataChange={setPlantillaEmail}
              />
            )}

            {/* Editor Email Avanzado */}
            {plantilla.tipo === 'email' && modoEmail === 'avanzado' && (
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
