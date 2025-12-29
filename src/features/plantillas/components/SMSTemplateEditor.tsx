/**
 * Editor de Plantillas SMS con React Hook Form + Zod
 * Validación en tiempo real de 160 caracteres máximo
 * Detección automática de caracteres especiales
 */

import { useCallback, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { plantillaSMSSchema, type PlantillaSMSFormData } from '../schemas/plantillaSchemas'
import { obtenerInfoCaracteresSMS } from '../utils/plantillaValidator'

interface SMSTemplateEditorProps {
  initialData?: Partial<PlantillaSMSFormData>
  onDataChange?: (data: PlantillaSMSFormData) => void
}

export function SMSTemplateEditor({
  initialData,
  onDataChange,
}: SMSTemplateEditorProps) {
  const form = useForm<PlantillaSMSFormData>({
    resolver: zodResolver(plantillaSMSSchema) as any,
    mode: 'onChange',
    defaultValues: {
      tipo: 'sms',
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      contenido: initialData?.contenido || '',
      activo: initialData?.activo !== false,
    },
  })

  const contenido = form.watch('contenido')

  // Calcular información de caracteres
  const infoCaracteres = useMemo(
    () => obtenerInfoCaracteresSMS(contenido),
    [contenido]
  )

  // Determinar color de la barra de progreso
  const obtenerColorProgreso = useCallback((): string => {
    if (infoCaracteres.porcentajeUso > 100) return 'bg-red-500'
    if (infoCaracteres.porcentajeUso > 80) return 'bg-orange-500'
    return 'bg-green-500'
  }, [infoCaracteres.porcentajeUso])

  // Notificar cambios con debounce para evitar re-renders excesivos
  // Obtener valores del formulario sin observar todos
  useEffect(() => {
    // Si el formulario no es válido, no notificar
    if (!form.formState.isValid) return

    // Crear un timer para debounce de 300ms
    const timer = setTimeout(() => {
      const formValues = form.getValues()
      onDataChange?.(formValues as PlantillaSMSFormData)
    }, 300)

    // Limpiar el timer si hay otro cambio antes de que se ejecute
    return () => clearTimeout(timer)
  }, [contenido, form.formState.isValid, onDataChange, form])

  return (
    <Form {...form}>
      <form className="space-y-6 bg-white dark:bg-gray-900 rounded-lg border border-segal-blue/10 dark:border-gray-700 p-6">
        {/* Información general */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-segal-dark dark:text-white">Información General</h3>

          {/* Nombre */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-segal-dark dark:text-white">
                  Nombre de la Plantilla <span className="text-segal-red dark:text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: SMS de Bienvenida"
                    className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    maxLength={100}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-segal-dark/60 dark:text-gray-400">
                  {field.value?.length || 0}/100 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-segal-dark dark:text-white">
                  Descripción (Opcional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe el propósito de esta plantilla..."
                    className="border-segal-blue/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white min-h-20"
                    maxLength={500}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-segal-dark/60 dark:text-gray-400">
                  {field.value?.length || 0}/500 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Activo */}
          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm font-medium text-segal-dark dark:text-white cursor-pointer mb-0">
                  Plantilla activa
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Editor de contenido */}
        <div className="space-y-4 border-t border-segal-blue/10 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-segal-dark dark:text-white">Contenido del SMS</h3>

          {/* Contador de caracteres */}
          <div className="bg-segal-blue/5 dark:bg-gray-800 rounded-lg p-4 border border-segal-blue/10 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-segal-dark dark:text-white">Caracteres utilizados</span>
              <span
                className={`text-lg font-bold ${
                  infoCaracteres.esValido ? 'text-segal-green dark:text-green-400' : 'text-segal-red dark:text-red-400'
                }`}
              >
                {infoCaracteres.longitudActual}/{160}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-segal-dark/10 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${obtenerColorProgreso()} transition-all duration-200`}
                style={{
                  width: `${Math.min(infoCaracteres.porcentajeUso, 100)}%`,
                }}
              />
            </div>

            {/* Información detallada */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-segal-dark/60 dark:text-gray-400">Disponibles:</span>
                <span className="font-semibold text-segal-dark dark:text-white">{infoCaracteres.disponibles}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-segal-dark/60 dark:text-gray-400">Uso:</span>
                <span className="font-semibold text-segal-dark dark:text-white">
                  {infoCaracteres.porcentajeUso.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Información sobre caracteres especiales */}
            {useMemo(() => {
              const tieneCaracteresEspeciales = /[€\[\]{}]/.test(contenido)
              return tieneCaracteresEspeciales ? (
                <div className="mt-3 flex gap-2 items-start text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-blue-800 dark:text-blue-300">
                    Algunos caracteres especiales (€, [], {'{}'}, etc.) cuentan como 2 caracteres
                  </p>
                </div>
              ) : null
            }, [contenido])}
          </div>

          {/* Textarea para contenido */}
          <FormField
            control={form.control}
            name="contenido"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-segal-dark dark:text-white">
                  Contenido <span className="text-segal-red dark:text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escribe el contenido de tu SMS aquí..."
                    className={`min-h-32 border-2 text-sm focus:outline-none transition-colors dark:bg-gray-800 dark:text-white ${
                      infoCaracteres.esValido && !fieldState.error
                        ? 'border-segal-blue/30 dark:border-gray-600 focus:border-segal-blue dark:focus:border-segal-turquoise focus:ring-segal-blue/20 dark:focus:ring-segal-turquoise/20'
                        : 'border-segal-red/30 dark:border-red-800 focus:border-segal-red dark:focus:border-red-600 focus:ring-segal-red/20 dark:focus:ring-red-600/20'
                    }`}
                    style={{ resize: 'vertical' }}
                    maxLength={160}
                    onChange={(e) => {
                      // Truncar el valor si excede 160 caracteres
                      const truncatedValue = e.target.value.slice(0, 160)
                      e.target.value = truncatedValue
                      // Usar solo field.onChange para evitar race conditions
                      field.onChange(e)
                    }}
                    onBlur={field.onBlur}
                    value={field.value}
                    disabled={field.disabled}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado de validación */}
        {form.formState.isValid ? (
          <div className="flex gap-2 items-center bg-segal-green/10 dark:bg-green-950/30 border border-segal-green/30 dark:border-green-800 rounded-lg p-4">
            <CheckCircle2 className="h-5 w-5 text-segal-green dark:text-green-400 shrink-0" />
            <p className="text-sm text-segal-green dark:text-green-400 font-medium">Plantilla SMS válida</p>
          </div>
        ) : (
          form.formState.errors.root &&
          Object.keys(form.formState.errors).length > 0 && (
            <div className="bg-segal-red/10 dark:bg-red-950/30 border border-segal-red/30 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-segal-red dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-segal-red dark:text-red-400 text-sm mb-1">Errores en el formulario</h4>
                  <p className="text-xs text-segal-red/80 dark:text-red-400/80">
                    Revisa los campos con errores arriba
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </form>
    </Form>
  )
}
