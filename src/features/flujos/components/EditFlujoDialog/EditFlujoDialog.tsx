/**
 * Dialog para editar flujos de nurturing
 * Permite:
 * - Editar nombre, descripción y estado del flujo
 * - CRUD de etapas (crear, editar, eliminar, reordenar)
 * - Validación de integridad de datos
 */

import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertCircle,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  CheckCircle2,
} from 'lucide-react'
import type { FlujoNurturing, EtapaFlujo } from '@/types/flujo'

// Esquema de validación para flujo
const editFlujoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  activo: z.boolean(),
})

// Esquema de validación para etapa
const etapaSchema = z.object({
  dia_envio: z.number().int().min(1, 'El día debe ser al menos 1').max(365, 'El día no puede exceder 365'),
  tipo_mensaje: z.enum(['email', 'sms', 'ambos'] as const),
  plantilla_mensaje: z
    .string()
    .min(1, 'La plantilla es requerida')
    .max(500, 'La plantilla no puede exceder 500 caracteres'),
  oferta_infocom_id: z.number().optional(),
  activo: z.boolean(),
})

type EditFlujoFormData = z.infer<typeof editFlujoSchema>
type EtapaFormData = z.infer<typeof etapaSchema>

interface EditFlujoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujo: FlujoNurturing | null
  onSuccess?: () => void
}

type EditMode = 'overview' | 'etapas' | 'editEtapa'

export function EditFlujoDialog({ open, onOpenChange, flujo, onSuccess }: EditFlujoDialogProps) {
  // Estado general
  const [editMode, setEditMode] = useState<EditMode>('overview')
  const [etapas, setEtapas] = useState<EtapaFlujo[]>([])
  const [editingEtapaIndex, setEditingEtapaIndex] = useState<number | null>(null)

  // Form para flujo
  const {
    control: flujoControl,
    handleSubmit: handleFlujosSubmit,
    formState: { errors: flujoErrors },
    reset: resetFlujosForm,
  } = useForm<EditFlujoFormData>({
    resolver: zodResolver(editFlujoSchema),
    defaultValues: {
      nombre: flujo?.nombre || '',
      descripcion: flujo?.descripcion || '',
      activo: flujo?.activo || false,
    },
  })

  // Form para etapa
  const {
    control: etapaControl,
    handleSubmit: handleEtapaSubmit,
    formState: { errors: etapaErrors },
    reset: resetEtapaForm,
  } = useForm<EtapaFormData>({
    resolver: zodResolver(etapaSchema),
    defaultValues: {
      dia_envio: 1,
      tipo_mensaje: 'email',
      plantilla_mensaje: '',
      oferta_infocom_id: undefined,
      activo: true,
    },
  })

  // Inicializar etapas cuando se abre el dialog
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen && flujo) {
        setEtapas(flujo.etapas || [])
        resetFlujosForm({
          nombre: flujo.nombre || '',
          descripcion: flujo.descripcion || '',
          activo: flujo.activo || false,
        })
      }
      onOpenChange(newOpen)
    },
    [flujo, onOpenChange, resetFlujosForm]
  )

  if (!flujo) {
    return null
  }

  // Handlers de etapas
  const handleAddEtapa = () => {
    setEditingEtapaIndex(null)
    resetEtapaForm()
    setEditMode('editEtapa')
  }

  const handleEditEtapa = (index: number) => {
    const etapa = etapas[index]
    setEditingEtapaIndex(index)
    resetEtapaForm({
      dia_envio: etapa.dia_envio,
      tipo_mensaje: etapa.tipo_mensaje,
      plantilla_mensaje: etapa.plantilla_mensaje,
      oferta_infocom_id: etapa.oferta_infocom_id,
      activo: etapa.activo,
    })
    setEditMode('editEtapa')
  }

  const handleDeleteEtapa = (index: number) => {
    setEtapas(etapas.filter((_, i) => i !== index))
  }

  const handleMoveEtapa = (fromIndex: number, toIndex: number) => {
    const newEtapas = [...etapas]
    const [movedEtapa] = newEtapas.splice(fromIndex, 1)
    newEtapas.splice(toIndex, 0, movedEtapa)
    setEtapas(newEtapas)
  }

  const onEtapaSubmit = (data: EtapaFormData) => {
    if (editingEtapaIndex !== null) {
      // Editar etapa existente
      const updatedEtapas = [...etapas]
      updatedEtapas[editingEtapaIndex] = {
        ...etapas[editingEtapaIndex],
        ...data,
      }
      setEtapas(updatedEtapas)
    } else {
      // Crear nueva etapa (sin ID hasta que se guarde en backend)
      setEtapas([
        ...etapas,
        {
          id: 0, // Será asignado por el backend
          flujo_id: flujo.id,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    }
    setEditMode('etapas')
  }

  const onFlujosSubmit = async (data: EditFlujoFormData) => {
    try {
      // TODO: Enviar datos actualizados al backend
      console.log('Actualizando flujo:', data)
      console.log('Con etapas:', etapas)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al actualizar flujo:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[70vw] max-h-[85vh] bg-white border border-segal-blue/20 shadow-2xl overflow-y-auto">
        <DialogHeader className="border-b border-segal-blue/10 pb-4 sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl font-bold text-segal-dark">
            Editar Flujo: {flujo?.nombre}
          </DialogTitle>
          <DialogDescription className="text-segal-dark/70">
            {editMode === 'overview' && 'Edita los detalles básicos del flujo'}
            {editMode === 'etapas' && 'Gestiona las etapas del flujo'}
            {editMode === 'editEtapa' && 'Configura los detalles de la etapa'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* MODO: Resumen del flujo */}
          {editMode === 'overview' && (
            <form onSubmit={handleFlujosSubmit(onFlujosSubmit)} className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold text-segal-dark">
                  Nombre del Flujo <span className="text-segal-red">*</span>
                </Label>
                <Controller
                  name="nombre"
                  control={flujoControl}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="nombre"
                      placeholder="Ej: Flujo Deudores Altos"
                      className="border-segal-blue/30"
                    />
                  )}
                />
                {flujoErrors.nombre && (
                  <p className="text-sm text-segal-red">{flujoErrors.nombre.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-semibold text-segal-dark">
                  Descripción (Opcional)
                </Label>
                <Controller
                  name="descripcion"
                  control={flujoControl}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id="descripcion"
                      placeholder="Describe el propósito de este flujo..."
                      className="w-full h-20 px-3 py-2 border border-segal-blue/30 rounded-lg focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 text-segal-dark text-sm"
                    />
                  )}
                />
                {flujoErrors.descripcion && (
                  <p className="text-sm text-segal-red">{flujoErrors.descripcion.message}</p>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-segal-dark">Estado</Label>
                <Controller
                  name="activo"
                  control={flujoControl}
                  render={({ field }) => (
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-segal-blue/10 bg-segal-blue/5 cursor-pointer">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-segal-dark">
                          {field.value ? 'Activo' : 'Inactivo'}
                        </p>
                        <p className="text-xs text-segal-dark/60">
                          {field.value
                            ? 'Este flujo está activo y en uso'
                            : 'Este flujo está inactivo'}
                        </p>
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Resumen de etapas */}
              <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                <p className="text-sm text-segal-dark">
                  <span className="font-semibold text-segal-blue">{etapas.length}</span> etapas
                  configuradas
                </p>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-segal-blue/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditMode('etapas')}
                  className="bg-segal-blue hover:bg-segal-blue/90 text-white"
                >
                  Editar Etapas
                </Button>
              </div>
            </form>
          )}

          {/* MODO: Gestionar etapas */}
          {editMode === 'etapas' && (
            <div className="space-y-6">
              {/* Header con botón de agregar */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-segal-dark">Etapas ({etapas.length})</h3>
                <Button
                  onClick={handleAddEtapa}
                  className="bg-segal-green hover:bg-segal-green/90 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Etapa
                </Button>
              </div>

              {/* Lista de etapas */}
              {etapas.length > 0 ? (
                <div className="space-y-3">
                  {etapas.map((etapa, index) => (
                    <div
                      key={index}
                      className="bg-white border border-segal-blue/10 rounded-lg p-4 hover:border-segal-blue/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <GripVertical className="h-5 w-5 text-segal-blue/40 mt-1 cursor-move" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-segal-blue text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <h4 className="text-sm font-bold text-segal-dark">
                                Día {etapa.dia_envio} -{' '}
                                {etapa.tipo_mensaje === 'email' ? 'Email' : etapa.tipo_mensaje === 'sms' ? 'SMS' : 'Ambos'}
                              </h4>
                              {etapa.activo && (
                                <CheckCircle2 className="h-5 w-5 text-segal-green" />
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 ml-11">
                              <div>
                                <p className="text-xs text-segal-dark/60">Plantilla</p>
                                <p className="text-sm font-medium text-segal-dark truncate">
                                  {etapa.plantilla_mensaje}
                                </p>
                              </div>

                              {etapa.oferta && (
                                <div>
                                  <p className="text-xs text-segal-dark/60">Oferta</p>
                                  <p className="text-sm font-medium text-segal-dark">
                                    {etapa.oferta.titulo}
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className="text-xs text-segal-dark/60">Tipo</p>
                                <div className="flex items-center gap-1">
                                  {etapa.tipo_mensaje === 'email' ? (
                                    <>
                                      <Mail className="h-4 w-4 text-segal-blue" />
                                      <span className="text-sm font-medium text-segal-dark">Email</span>
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="h-4 w-4 text-segal-blue" />
                                      <span className="text-sm font-medium text-segal-dark">SMS</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditEtapa(index)}
                            variant="outline"
                            size="sm"
                            className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteEtapa(index)}
                            variant="outline"
                            size="sm"
                            className="border-segal-red/20 text-segal-red hover:bg-segal-red/5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Botones de reordenamiento */}
                      {index > 0 && (
                        <div className="mt-3 pt-3 border-t border-segal-blue/10 flex justify-start gap-2">
                          <Button
                            onClick={() => handleMoveEtapa(index, index - 1)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            ↑ Subir
                          </Button>
                        </div>
                      )}
                      {index < etapas.length - 1 && (
                        <div className="mt-3 pt-3 border-t border-segal-blue/10 flex justify-start gap-2">
                          <Button
                            onClick={() => handleMoveEtapa(index, index + 1)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            ↓ Bajar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-segal-blue/40 mb-2" />
                  <p className="text-segal-dark/60">No hay etapas configuradas</p>
                  <p className="text-sm text-segal-dark/50 mt-1">
                    Agrega una nueva etapa para continuar
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-between gap-3 pt-4 border-t border-segal-blue/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode('overview')}
                  className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                >
                  Atrás
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleFlujosSubmit(onFlujosSubmit)}
                    className="bg-segal-green hover:bg-segal-green/90 text-white"
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* MODO: Editar etapa individual */}
          {editMode === 'editEtapa' && (
            <form onSubmit={handleEtapaSubmit(onEtapaSubmit)} className="space-y-6">
              <div className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-3">
                <p className="text-sm text-segal-dark/60">
                  {editingEtapaIndex !== null
                    ? `Editando etapa ${editingEtapaIndex + 1}`
                    : 'Creando nueva etapa'}
                </p>
              </div>

              {/* Día de envío */}
              <div className="space-y-2">
                <Label htmlFor="dia_envio" className="text-sm font-semibold text-segal-dark">
                  Día de Envío <span className="text-segal-red">*</span>
                </Label>
                <Controller
                  name="dia_envio"
                  control={etapaControl}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dia_envio"
                      type="number"
                      min="1"
                      max="365"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      placeholder="Ej: 1"
                      className="border-segal-blue/30"
                    />
                  )}
                />
                {etapaErrors.dia_envio && (
                  <p className="text-sm text-segal-red">{etapaErrors.dia_envio.message}</p>
                )}
              </div>

              {/* Tipo de mensaje */}
              <div className="space-y-2">
                <Label htmlFor="tipo_mensaje" className="text-sm font-semibold text-segal-dark">
                  Tipo de Mensaje <span className="text-segal-red">*</span>
                </Label>
                <Controller
                  name="tipo_mensaje"
                  control={etapaControl}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full border border-segal-blue/30 bg-white text-segal-dark">
                        <SelectValue placeholder="Selecciona tipo de mensaje..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-segal-blue/20">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {etapaErrors.tipo_mensaje && (
                  <p className="text-sm text-segal-red">{etapaErrors.tipo_mensaje.message}</p>
                )}
              </div>

              {/* Plantilla de mensaje */}
              <div className="space-y-2">
                <Label htmlFor="plantilla_mensaje" className="text-sm font-semibold text-segal-dark">
                  Plantilla de Mensaje <span className="text-segal-red">*</span>
                </Label>
                <Controller
                  name="plantilla_mensaje"
                  control={etapaControl}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id="plantilla_mensaje"
                      placeholder="Escribe la plantilla del mensaje..."
                      className="w-full h-32 px-3 py-2 border border-segal-blue/30 rounded-lg focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 text-segal-dark text-sm"
                    />
                  )}
                />
                {etapaErrors.plantilla_mensaje && (
                  <p className="text-sm text-segal-red">{etapaErrors.plantilla_mensaje.message}</p>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-segal-dark">Estado</Label>
                <Controller
                  name="activo"
                  control={etapaControl}
                  render={({ field }) => (
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-segal-blue/10 bg-segal-blue/5 cursor-pointer">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-segal-dark">
                          {field.value ? 'Activo' : 'Inactivo'}
                        </p>
                        <p className="text-xs text-segal-dark/60">
                          {field.value
                            ? 'Esta etapa está activa'
                            : 'Esta etapa está inactiva'}
                        </p>
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-between gap-3 pt-4 border-t border-segal-blue/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode('etapas')}
                  className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-segal-blue hover:bg-segal-blue/90 text-white"
                >
                  {editingEtapaIndex !== null ? 'Actualizar' : 'Crear'} Etapa
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
