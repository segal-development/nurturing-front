/**
 * Dialog para crear nuevos flujos de nurturing
 * Permite:
 * - Seleccionar origen de datos
 * - Ver y seleccionar prospectos con checkboxes
 * - Elegir tipo de mensaje (Email, SMS, Ambos)
 * - Calcular automáticamente costos basados en prospectos seleccionados
 */

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Mail, MessageSquare, DollarSign, Users, Loader2, Check, X } from 'lucide-react'
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
import type { TipoMensaje } from '@/types/flujo'
import type { OpcionesFlujos } from '@/api/flujos.service'
import type { Prospecto } from '@/types/prospecto'
import { flujosService } from '@/api/flujos.service'
import { prospectosService } from '@/api/prospectos.service'
import { configuracionService } from '@/api/configuracion.service'

// Esquema de validación
const createFlujoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  tipo_prospecto: z.string().min(1, 'Debes seleccionar un tipo de deudor'),
  tipo_mensaje: z.enum(['email', 'sms', 'ambos'] as const),
})

type CreateFlujoFormData = z.infer<typeof createFlujoSchema>

interface CreateFlujoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoDeudor: string | null
  opciones?: OpcionesFlujos
  onSuccess?: () => void
}

type Step = 'origin' | 'prospects' | 'config'

export function CreateFlujoDialog({
  open,
  onOpenChange,
  tipoDeudor,
  opciones,
  onSuccess,
}: CreateFlujoDialogProps) {
  // Estado de steps y selecciones
  const [currentStep, setCurrentStep] = useState<Step>('origin')
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null)
  const [selectedOriginName, setSelectedOriginName] = useState<string | null>(null)
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loadingProspectos, setLoadingProspectos] = useState(false)
  const [selectedProspectoIds, setSelectedProspectoIds] = useState<Set<number>>(new Set())
  const [selectedTipoMensaje, setSelectedTipoMensaje] = useState<TipoMensaje>('email')
  const [emailPercentage, setEmailPercentage] = useState(50)
  const [costEmail, setCostEmail] = useState(1)
  const [costSms, setCostSms] = useState(11)
  const [loadingPrices, setLoadingPrices] = useState(true)

  // Cargar precios al abrir el dialog
  useEffect(() => {
    if (open) {
      cargarPrecios()
    }
  }, [open])

  const cargarPrecios = async () => {
    try {
      setLoadingPrices(true)
      const precios = await configuracionService.obtenerPrecios()
      setCostEmail(precios.email_costo)
      setCostSms(precios.sms_costo)
      console.log('✅ Precios cargados:', { email: precios.email_costo, sms: precios.sms_costo })
    } catch (error) {
      console.error('❌ Error cargando precios:', error)
      // Usar valores por defecto en caso de error
      setCostEmail(1)
      setCostSms(11)
    } finally {
      setLoadingPrices(false)
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
    reset,
  } = useForm<CreateFlujoFormData>({
    resolver: zodResolver(createFlujoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipo_prospecto: tipoDeudor || '',
      tipo_mensaje: 'email',
    },
  })

  // Cargar prospectos cuando se selecciona un origen
  const handleOriginSelect = async (originId: string) => {
    setSelectedOriginId(originId)
    const origin = opciones?.origenes?.find((o) => o.id === originId)
    setSelectedOriginName(origin?.nombre || null)
    setLoadingProspectos(true)
    setSelectedProspectoIds(new Set())

    try {
      console.log('📥 Cargando prospectos para origen:', originId)
      const response = await prospectosService.getAll({
        origen: originId,
        per_page: 1000, // Traer todos los prospectos sin paginar
      })
      setProspectos(response.data)
      console.log('✅ Prospectos cargados:', response.data.length)
    } catch (error) {
      console.error('❌ Error cargando prospectos:', error)
      setProspectos([])
    } finally {
      setLoadingProspectos(false)
    }
  }

  // Manejar selección/deselección de prospectos
  const toggleProspecto = (prospecto: Prospecto) => {
    const newSelected = new Set(selectedProspectoIds)
    if (newSelected.has(prospecto.id)) {
      newSelected.delete(prospecto.id)
    } else {
      newSelected.add(prospecto.id)
    }
    setSelectedProspectoIds(newSelected)
  }

  // Seleccionar todos
  const selectAll = () => {
    setSelectedProspectoIds(new Set(prospectos.map((p) => p.id)))
  }

  // Deseleccionar todos
  const deselectAll = () => {
    setSelectedProspectoIds(new Set())
  }

  // Cálculo de distribución
  const calculateDistribution = () => {
    const totalSelected = selectedProspectoIds.size

    if (selectedTipoMensaje === 'email') {
      return {
        email: totalSelected,
        sms: 0,
        emailCost: totalSelected * costEmail,
        smsCost: 0,
      }
    } else if (selectedTipoMensaje === 'sms') {
      return {
        email: 0,
        sms: totalSelected,
        emailCost: 0,
        smsCost: totalSelected * costSms,
      }
    } else {
      // Ambos
      const emailCount = Math.floor((totalSelected * emailPercentage) / 100)
      const smsCount = totalSelected - emailCount
      return {
        email: emailCount,
        sms: smsCount,
        emailCost: emailCount * costEmail,
        smsCost: smsCount * costSms,
      }
    }
  }

  const distribution = calculateDistribution()
  const totalCost = distribution.emailCost + distribution.smsCost

  const onSubmit = async (data: CreateFlujoFormData) => {
    try {
      // Preparar datos completos para enviar al backend
      const backendPayload = {
        // Información básica del flujo
        flujo: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipo_prospecto: data.tipo_prospecto,
          activo: true,
        },
        // Información de origen y selección
        origen_id: selectedOriginId,
        origen_nombre: selectedOriginName,
        // Información de prospectos
        prospectos: {
          total_seleccionados: selectedProspectoIds.size,
          ids_seleccionados: Array.from(selectedProspectoIds),
          total_disponibles: prospectos.length,
        },
        // Información de tipo de mensaje
        tipo_mensaje: {
          tipo: selectedTipoMensaje,
          email_percentage: selectedTipoMensaje === 'email' ? 100 : selectedTipoMensaje === 'sms' ? 0 : emailPercentage,
          sms_percentage: selectedTipoMensaje === 'sms' ? 100 : selectedTipoMensaje === 'email' ? 0 : 100 - emailPercentage,
        },
        // Distribución y costos
        distribucion: {
          email: {
            cantidad: distribution.email,
            costo_unitario: costEmail,
            costo_total: distribution.emailCost,
          },
          sms: {
            cantidad: distribution.sms,
            costo_unitario: costSms,
            costo_total: distribution.smsCost,
          },
          resumen: {
            total_prospectos: selectedProspectoIds.size,
            costo_total: totalCost,
          },
        },
        // Metadatos
        metadata: {
          fecha_creacion: new Date().toISOString(),
          navegador: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      }

      // Enviar al backend con los datos completos
      await flujosService.createWithProspectos(backendPayload)

      // Cerrar y llamar callback de éxito
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('❌ Error al crear flujo:', error)
      // TODO: Mostrar error al usuario
    }
  }

  const handleClose = () => {
    reset()
    setCurrentStep('origin')
    setSelectedOriginId(null)
    setSelectedOriginName(null)
    setProspectos([])
    setSelectedProspectoIds(new Set())
    setSelectedTipoMensaje('email')
    setEmailPercentage(50)
    onOpenChange(false)
  }

  const canProceedToProspects = selectedOriginId && prospectos.length > 0
  const canProceedToConfig = selectedProspectoIds.size > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[60vw] bg-white border border-segal-blue/20 shadow-2xl">
        <DialogHeader className="border-b border-segal-blue/10 pb-4">
          <DialogTitle className="text-2xl font-bold text-segal-dark">Crear Nuevo Flujo</DialogTitle>
          <DialogDescription className="text-segal-dark/70">
            {currentStep === 'origin' &&
              'Selecciona el origen de datos de donde obtendrás los prospectos'}
            {currentStep === 'prospects' &&
              'Selecciona qué prospectos incluirás en este flujo'}
            {currentStep === 'config' &&
              'Configura el flujo seleccionando el tipo de mensaje y los detalles'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
          {/* STEP 1: ORIGIN SELECTION */}
          {currentStep === 'origin' && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-segal-dark mb-3 block">
                  Selecciona el Origen de Datos <span className="text-segal-red">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {opciones?.origenes?.map((origin) => (
                    <button
                      key={origin.id}
                      onClick={() => handleOriginSelect(origin.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedOriginId === origin.id
                          ? 'border-segal-blue bg-segal-blue/5'
                          : 'border-segal-blue/20 hover:border-segal-blue/40'
                      }`}
                    >
                      <p className="font-semibold text-segal-dark">{origin.nombre}</p>
                      <p className="text-sm text-segal-dark/60 mt-1">
                        {origin.total_flujos} flujos
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-segal-blue/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={!canProceedToProspects || loadingProspectos}
                  onClick={() => setCurrentStep('prospects')}
                  className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
                >
                  {loadingProspectos ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: PROSPECT SELECTION */}
          {currentStep === 'prospects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-segal-dark">
                    Origen: <span className="text-segal-blue">{selectedOriginName}</span>
                  </p>
                  <p className="text-sm text-segal-dark/60">
                    Total disponibles: {prospectos.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="border-segal-green/20 text-segal-green hover:bg-segal-green/5"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Seleccionar Todo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="border-segal-red/20 text-segal-red hover:bg-segal-red/5"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Deseleccionar
                  </Button>
                </div>
              </div>

              {/* Prospectos List */}
              <div className="border border-segal-blue/10 rounded-lg max-h-96 overflow-y-auto">
                {prospectos.length === 0 ? (
                  <div className="p-6 text-center text-segal-dark/60">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-segal-dark/40" />
                    No hay prospectos disponibles en este origen
                  </div>
                ) : (
                  <div className="divide-y divide-segal-blue/10">
                    {prospectos.map((prospecto) => (
                      <div
                        key={prospecto.id}
                        className="p-3 hover:bg-segal-blue/5 transition-colors flex items-start gap-3"
                      >
                        <Checkbox
                          checked={selectedProspectoIds.has(prospecto.id)}
                          onCheckedChange={() => toggleProspecto(prospecto)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-segal-dark text-sm">{prospecto.nombre}</p>
                          <div className="flex gap-4 mt-1 text-xs text-segal-dark/60">
                            {prospecto.email && <span>📧 {prospecto.email}</span>}
                            {prospecto.telefono && <span>📱 {prospecto.telefono}</span>}
                            {prospecto.monto_deuda && (
                              <span>💰 ${prospecto.monto_deuda.toLocaleString('es-CL')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="bg-segal-blue/5 rounded-lg p-3 border border-segal-blue/10">
                <p className="text-sm text-segal-dark">
                  <span className="font-semibold text-segal-blue">{selectedProspectoIds.size}</span>{' '}
                  de {prospectos.length} prospectos seleccionados
                </p>
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-segal-blue/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('origin')}
                  className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  disabled={!canProceedToConfig}
                  onClick={() => setCurrentStep('config')}
                  className="bg-segal-blue hover:bg-segal-blue/90 text-white disabled:opacity-50"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIGURATION */}
          {currentStep === 'config' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Resumen de selección */}
              <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-segal-dark">
                      Origen: <span className="text-segal-blue">{selectedOriginName}</span>
                    </p>
                    <p className="text-sm text-segal-dark/60 mt-1">
                      Prospectos: <span className="font-semibold">{selectedProspectoIds.size}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep('prospects')}
                    className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                  >
                    Cambiar selección
                  </Button>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold text-segal-dark">
                  Nombre del Flujo <span className="text-segal-red">*</span>
                </Label>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="nombre"
                      placeholder="Ej: Flujo Deudores Altos - Enero"
                      className="border-segal-blue/30"
                    />
                  )}
                />
                {formErrors.nombre && (
                  <p className="text-sm text-segal-red">{formErrors.nombre.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-semibold text-segal-dark">
                  Descripción (Opcional)
                </Label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id="descripcion"
                      placeholder="Describe el propósito de este flujo..."
                      className="w-full h-20 px-3 py-2 border border-segal-blue/30 rounded-lg focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 text-segal-dark text-sm"
                    />
                  )}
                />
                {formErrors.descripcion && (
                  <p className="text-sm text-segal-red">{formErrors.descripcion.message}</p>
                )}
              </div>

              {/* Tipo de Deudor */}
              <div className="space-y-2">
                <Label
                  htmlFor="tipo_prospecto"
                  className="text-sm font-semibold text-segal-dark"
                >
                  Tipo de Deudor <span className="text-segal-red">*</span>
                </Label>
                <Controller
                  name="tipo_prospecto"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full border border-segal-blue/30 bg-white text-segal-dark focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20">
                        <SelectValue placeholder="Selecciona un tipo de deudor..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-segal-blue/20">
                        <SelectItem value="deuda-baja">Deuda Baja</SelectItem>
                        <SelectItem value="deuda-media">Deuda Media</SelectItem>
                        <SelectItem value="deuda-alta">Deuda Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {formErrors.tipo_prospecto && (
                  <p className="text-sm text-segal-red">{formErrors.tipo_prospecto.message}</p>
                )}
              </div>

              {/* Tipo de Mensaje */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-segal-dark">
                  Tipo de Mensaje <span className="text-segal-red">*</span>
                </Label>
                {loadingPrices && (
                  <div className="text-sm text-segal-dark/60 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando precios actualizados...
                  </div>
                )}
                <Controller
                  name="tipo_mensaje"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-3">
                      {/* Email */}
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange('email')
                          setSelectedTipoMensaje('email')
                        }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedTipoMensaje === 'email'
                            ? 'border-segal-blue bg-segal-blue/5'
                            : 'border-segal-blue/20 hover:border-segal-blue/40'
                        }`}
                      >
                        <Mail className="h-6 w-6 text-segal-blue" />
                        <span className="text-sm font-semibold text-segal-dark">Email</span>
                        <span className="text-xs text-segal-dark/60">${costEmail} por envío</span>
                      </button>

                      {/* SMS */}
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange('sms')
                          setSelectedTipoMensaje('sms')
                        }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedTipoMensaje === 'sms'
                            ? 'border-segal-blue bg-segal-blue/5'
                            : 'border-segal-blue/20 hover:border-segal-blue/40'
                        }`}
                      >
                        <MessageSquare className="h-6 w-6 text-segal-blue" />
                        <span className="text-sm font-semibold text-segal-dark">SMS</span>
                        <span className="text-xs text-segal-dark/60">${costSms} por envío</span>
                      </button>

                      {/* Ambos */}
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange('ambos')
                          setSelectedTipoMensaje('ambos')
                        }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedTipoMensaje === 'ambos'
                            ? 'border-segal-blue bg-segal-blue/5'
                            : 'border-segal-blue/20 hover:border-segal-blue/40'
                        }`}
                      >
                        <div className="flex gap-1">
                          <Mail className="h-5 w-5 text-segal-blue" />
                          <MessageSquare className="h-5 w-5 text-segal-blue" />
                        </div>
                        <span className="text-sm font-semibold text-segal-dark">Ambos</span>
                        <span className="text-xs text-segal-dark/60">Mixto</span>
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Slider para distribución (solo si es "ambos") */}
              {selectedTipoMensaje === 'ambos' && (
                <div className="space-y-3 bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-4">
                  <label className="text-sm font-semibold text-segal-dark">
                    Distribución: {emailPercentage}% Email - {100 - emailPercentage}% SMS
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={emailPercentage}
                    onChange={(e) => setEmailPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-segal-blue/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Resumen de distribución */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Prospectos */}
                <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-segal-blue" />
                    <p className="text-xs text-segal-dark/60 font-medium">Total Prospectos</p>
                  </div>
                  <p className="text-2xl font-bold text-segal-dark">{selectedProspectoIds.size}</p>
                </div>

                {/* Costo Email */}
                {(selectedTipoMensaje === 'email' || selectedTipoMensaje === 'ambos') && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-green-700 font-medium">Email</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {distribution.email}{' '}
                      <span className="text-sm">
                        (${distribution.emailCost.toLocaleString('es-CL')})
                      </span>
                    </p>
                  </div>
                )}

                {/* Costo SMS */}
                {(selectedTipoMensaje === 'sms' || selectedTipoMensaje === 'ambos') && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-blue-700 font-medium">SMS</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {distribution.sms}{' '}
                      <span className="text-sm">
                        (${distribution.smsCost.toLocaleString('es-CL')})
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Costo Total */}
              <div className="bg-segal-dark/5 rounded-lg p-4 border border-segal-dark/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-segal-dark" />
                    <p className="text-sm font-semibold text-segal-dark">Costo Total del Flujo</p>
                  </div>
                  <p className="text-3xl font-bold text-segal-dark">
                    ${totalCost.toLocaleString('es-CL')}
                  </p>
                </div>
                <p className="text-xs text-segal-dark/60 mt-2">
                  Este costo es estimado basado en los {selectedProspectoIds.size} prospectos
                  seleccionados
                </p>
              </div>

              {/* Botones */}
              <div className="flex justify-between gap-3 pt-4 border-t border-segal-blue/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('prospects')}
                  className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                >
                  Atrás
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-segal-blue hover:bg-segal-blue/90 text-white"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Flujo'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
