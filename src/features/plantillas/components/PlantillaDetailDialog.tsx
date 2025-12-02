/**
 * Dialog para ver detalles de una plantilla existente
 * Permite ver el contenido y copiar la plantilla
 */

import { useState, useEffect } from 'react'
import { Copy, Loader2, AlertCircle } from 'lucide-react'
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
import type { AnyPlantilla, PlantillaSMS, PlantillaEmail } from '@/types/plantilla'
import { EmailTemplatePreview } from './EmailTemplates'
import type { EmailBlockData } from './EmailTemplates'

interface PlantillaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantillaId?: number
  onCopy?: (plantilla: AnyPlantilla) => void
}

export function PlantillaDetailDialog({
  open,
  onOpenChange,
  plantillaId,
  onCopy,
}: PlantillaDetailDialogProps) {
  const [plantilla, setPlantilla] = useState<AnyPlantilla | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar detalles de la plantilla
  useEffect(() => {
    if (!open || !plantillaId) return

    const cargarDetalles = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await plantillasService.getById(plantillaId)
        setPlantilla(data)
      } catch (err: any) {
        console.error('Error cargando plantilla:', err)
        const mensaje = err.response?.data?.message || 'No se pudo cargar la plantilla'
        setError(mensaje)
        toast.error(mensaje)
      } finally {
        setIsLoading(false)
      }
    }

    cargarDetalles()
  }, [open, plantillaId])

  const handleCopiar = () => {
    if (!plantilla) return
    onCopy?.(plantilla)
    onOpenChange(false)
    toast.success('Plantilla duplicada, abre el formulario para crear')
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Plantilla</DialogTitle>
          <DialogDescription>
            {plantilla?.tipo === 'sms' ? '📱 Plantilla SMS' : '📧 Plantilla Email'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 text-sm">Error al cargar</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        ) : plantilla ? (
          <div className="space-y-6">
            {/* Información general */}
            <div className="space-y-4 bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
              <div>
                <label className="text-sm font-semibold text-segal-dark">Nombre</label>
                <p className="text-sm text-segal-dark/80 mt-1">{plantilla.nombre}</p>
              </div>

              {plantilla.descripcion && (
                <div>
                  <label className="text-sm font-semibold text-segal-dark">Descripción</label>
                  <p className="text-sm text-segal-dark/80 mt-1">{plantilla.descripcion}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-segal-dark">Estado</label>
                <p className="text-sm text-segal-dark/80 mt-1">
                  {plantilla.activo ? (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      ✓ Activo
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      ✗ Inactivo
                    </span>
                  )}
                </p>
              </div>

              {plantilla.fecha_creacion && (
                <div>
                  <label className="text-sm font-semibold text-segal-dark">Creada</label>
                  <p className="text-sm text-segal-dark/80 mt-1">
                    {new Date(plantilla.fecha_creacion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
            </div>

            {/* Contenido específico por tipo */}
            {plantilla.tipo === 'sms' ? (
              <div className="space-y-4 bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                <label className="text-sm font-semibold text-segal-dark block">Contenido SMS</label>
                <div className="bg-white rounded border border-segal-blue/20 p-4 min-h-24 max-h-40 overflow-y-auto">
                  <p className="text-sm text-segal-dark whitespace-pre-wrap">
                    {(plantilla as PlantillaSMS).contenido}
                  </p>
                </div>
                <p className="text-xs text-segal-dark/60">
                  {(plantilla as PlantillaSMS).contenido.length}/160 caracteres
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                  <div>
                    <label className="text-sm font-semibold text-segal-dark">Asunto</label>
                    <p className="text-sm text-segal-dark/80 mt-1">
                      {(plantilla as PlantillaEmail).asunto}
                    </p>
                  </div>
                </div>

                {/* Email Avanzado (react-email) */}
                {((plantilla as PlantillaEmail).componentes as any)?.some((c: any) => c.tipo === 'html-avanzado') ? (
                  <div className="space-y-4 bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                    <label className="text-sm font-semibold text-segal-dark block">Vista Previa</label>
                    {(() => {
                      const componenteAvanzado = ((plantilla as PlantillaEmail).componentes as any)?.find(
                        (c: any) => c.tipo === 'html-avanzado'
                      )
                      const bloques = componenteAvanzado?.contenido?.bloques
                        ? JSON.parse(
                            typeof componenteAvanzado.contenido.bloques === 'string'
                              ? componenteAvanzado.contenido.bloques
                              : JSON.stringify(componenteAvanzado.contenido.bloques)
                          )
                        : []

                      return (
                        <div className="h-96 overflow-hidden rounded border border-segal-blue/20">
                          <EmailTemplatePreview
                            blocks={bloques as EmailBlockData[]}
                            config={{
                              subject: (plantilla as PlantillaEmail).asunto,
                              headerText: 'Email Template Preview',
                            }}
                          />
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  /* Email Modular */
                  <div className="space-y-4 bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                    <label className="text-sm font-semibold text-segal-dark">Componentes</label>
                    <div className="mt-1 space-y-2">
                      {(plantilla as PlantillaEmail).componentes.map((comp, idx) => (
                        <div
                          key={comp.id}
                          className="text-sm bg-white rounded p-2 border border-segal-blue/10"
                        >
                          <span className="font-medium text-segal-dark">{idx + 1}.</span>
                          {' '}
                          <span className="capitalize text-segal-dark/80">
                            {comp.tipo === 'texto' ? '📝 Texto' : ''}
                            {comp.tipo === 'logo' ? '🖼️ Logo' : ''}
                            {comp.tipo === 'boton' ? '🔘 Botón' : ''}
                            {comp.tipo === 'separador' ? '─ Separador' : ''}
                            {comp.tipo === 'footer' ? '📋 Footer' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-segal-blue/20 text-segal-dark hover:bg-segal-blue/5"
          >
            Cerrar
          </Button>
          {plantilla && (
            <Button
              onClick={handleCopiar}
              className="bg-segal-blue hover:bg-segal-blue/90 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
