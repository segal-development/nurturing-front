/**
 * Editor de Plantillas SMS con React Hook Form + Zod
 * Validación en tiempo real de 160 caracteres máximo
 * Detección automática de caracteres especiales
 * Soporte para variables dinámicas con autocompletado
 */

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Info, PanelRightOpen, PanelRightClose } from 'lucide-react'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { plantillaSMSSchema, type PlantillaSMSFormData } from '../schemas/plantillaSchemas'
import { obtenerInfoCaracteresSMS } from '../utils/plantillaValidator'
import { VariablesPanel } from './VariablesPanel'
import { VariableAutocomplete } from './VariableAutocomplete'
import { useVariables } from '../hooks/useVariables'

interface SMSTemplateEditorProps {
  initialData?: Partial<PlantillaSMSFormData>
  onDataChange?: (data: PlantillaSMSFormData) => void
}

export function SMSTemplateEditor({
  initialData,
  onDataChange,
}: SMSTemplateEditorProps) {
  const [showVariablesPanel, setShowVariablesPanel] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [_autocompletePos, _setAutocompletePos] = useState({ top: 0, left: 0 })
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0)

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

  // Variables hook for autocomplete
  const {
    filteredVariables,
    showAutocomplete: _showAutocomplete,
    autocompleteFilter: _autocompleteFilter,
    closeAutocomplete,
    insertVariable,
  } = useVariables()

  // Watch all relevant fields for changes
  const formValues = form.watch()
  const contenido = formValues.contenido || ''

  // Calcular información de caracteres
  const infoCaracteres = obtenerInfoCaracteresSMS(contenido)

  // Handle variable insertion from panel
  const handleInsertVariable = (variable: string) => {
    const currentValue = form.getValues('contenido')
    const newValue = insertVariable(variable, textareaRef.current)
    if (newValue !== variable) {
      form.setValue('contenido', newValue, { shouldValidate: true })
    } else {
      // Fallback: append at end if no textarea ref
      form.setValue('contenido', currentValue + variable, { shouldValidate: true })
    }
  }

  // Handle autocomplete selection
  const handleAutocompleteSelect = (variable: { key: string }) => {
    const currentValue = form.getValues('contenido')
    const cursorPos = textareaRef.current?.selectionStart ?? currentValue.length
    const textBeforeCursor = currentValue.substring(0, cursorPos)
    const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')

    if (lastOpenBraces !== -1) {
      const before = currentValue.substring(0, lastOpenBraces)
      const after = currentValue.substring(cursorPos)
      const variableTag = `{{${variable.key}}}`
      const newValue = before + variableTag + after

      form.setValue('contenido', newValue, { shouldValidate: true })

      // Set cursor after the variable
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastOpenBraces + variableTag.length
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos
          textareaRef.current.focus()
        }
      }, 0)
    }

    closeAutocomplete()
  }

  // Detect {{ typing for autocomplete
  const [localShowAutocomplete, setLocalShowAutocomplete] = useState(false)
  const [localAutocompleteFilter, setLocalAutocompleteFilter] = useState('')

  const handleContenidoChange = (value: string, cursorPos: number) => {
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')

    if (lastOpenBraces !== -1) {
      const textAfterBraces = textBeforeCursor.substring(lastOpenBraces + 2)
      const hasClosingBraces = textAfterBraces.includes('}}')

      if (!hasClosingBraces && /^[a-zA-Z0-9_.]*$/.test(textAfterBraces)) {
        setLocalAutocompleteFilter(textAfterBraces)
        setLocalShowAutocomplete(true)
        setSelectedAutocompleteIndex(0)
        return
      }
    }

    setLocalShowAutocomplete(false)
  }

  // Filter variables for local autocomplete
  const localFilteredVariables = localAutocompleteFilter
    ? filteredVariables.filter(
        (v) =>
          v.key.toLowerCase().includes(localAutocompleteFilter.toLowerCase()) ||
          v.label.toLowerCase().includes(localAutocompleteFilter.toLowerCase())
      )
    : filteredVariables

  // Determinar color de la barra de progreso
  const obtenerColorProgreso = (): string => {
    if (infoCaracteres.porcentajeUso > 100) return 'bg-red-500'
    if (infoCaracteres.porcentajeUso > 80) return 'bg-orange-500'
    return 'bg-green-500'
  }

  // Notificar cambios con debounce para evitar re-renders excesivos
  useEffect(() => {
    // Si el formulario no es válido, no notificar
    if (!form.formState.isValid) return

    // Crear un timer para debounce de 300ms
    const timer = setTimeout(() => {
      onDataChange?.(formValues as PlantillaSMSFormData)
    }, 300)

    // Limpiar el timer si hay otro cambio antes de que se ejecute
    return () => clearTimeout(timer)
  }, [formValues.nombre, formValues.descripcion, formValues.contenido, formValues.activo, form.formState.isValid, onDataChange])

  return (
    <div className="flex gap-4">
      {/* Main Form */}
      <Form {...form}>
        <form className="flex-1 space-y-6 bg-white dark:bg-gray-900 rounded-lg border border-segal-blue/10 dark:border-gray-700 p-6">
          {/* Header con toggle de variables */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-segal-dark dark:text-white">Información General</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowVariablesPanel(!showVariablesPanel)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showVariablesPanel ? (
                <>
                  <PanelRightClose className="h-4 w-4 mr-1" />
                  Ocultar Variables
                </>
              ) : (
                <>
                  <PanelRightOpen className="h-4 w-4 mr-1" />
                  Mostrar Variables
                </>
              )}
            </Button>
          </div>

          {/* Información general */}
          <div className="space-y-4">

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
            {(() => {
              const tieneCaracteresEspeciales = /[€\[\]{}]/.test(contenido)
              return tieneCaracteresEspeciales ? (
                <div className="mt-3 flex gap-2 items-start text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-blue-800 dark:text-blue-300">
                    Algunos caracteres especiales (€, [], {'{}'}, etc.) cuentan como 2 caracteres
                  </p>
                </div>
              ) : null
            })()}
          </div>

          {/* Textarea para contenido con autocompletado */}
          <FormField
            control={form.control}
            name="contenido"
            render={({ field, fieldState }) => (
              <FormItem className="relative">
                <FormLabel className="text-sm font-semibold text-segal-dark dark:text-white">
                  Contenido <span className="text-segal-red dark:text-red-400">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Escribe el contenido de tu SMS aquí... Usa {{ para insertar variables"
                    className={`min-h-32 border-2 text-sm focus:outline-none transition-colors dark:bg-gray-800 dark:text-white ${
                      infoCaracteres.esValido && !fieldState.error
                        ? 'border-segal-blue/30 dark:border-gray-600 focus:border-segal-blue dark:focus:border-segal-turquoise focus:ring-segal-blue/20 dark:focus:ring-segal-turquoise/20'
                        : 'border-segal-red/30 dark:border-red-800 focus:border-segal-red dark:focus:border-red-600 focus:ring-segal-red/20 dark:focus:ring-red-600/20'
                    }`}
                    style={{ resize: 'vertical' }}
                    maxLength={160}
                    onChange={(e) => {
                      const truncatedValue = e.target.value.slice(0, 160)
                      e.target.value = truncatedValue
                      field.onChange(e)
                      // Check for autocomplete trigger
                      handleContenidoChange(truncatedValue, e.target.selectionStart)
                    }}
                    onKeyDown={(e) => {
                      if (localShowAutocomplete) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setSelectedAutocompleteIndex((prev) =>
                            prev < Math.min(localFilteredVariables.length - 1, 14) ? prev + 1 : 0
                          )
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setSelectedAutocompleteIndex((prev) =>
                            prev > 0 ? prev - 1 : Math.min(localFilteredVariables.length - 1, 14)
                          )
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          if (localFilteredVariables.length > 0) {
                            e.preventDefault()
                            handleAutocompleteSelect(localFilteredVariables[selectedAutocompleteIndex])
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          setLocalShowAutocomplete(false)
                        }
                      }
                    }}
                    onBlur={() => {
                      field.onBlur()
                      // Delay closing to allow click on autocomplete
                      setTimeout(() => setLocalShowAutocomplete(false), 200)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'copy'
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const variable = e.dataTransfer.getData('application/x-variable') || e.dataTransfer.getData('text/plain')
                      if (variable && variable.startsWith('{{')) {
                        const currentValue = field.value || ''
                        // Get drop position from caret position in textarea
                        const textarea = e.currentTarget
                        
                        // Approximate cursor position - insert at end if can't determine
                        // For simplicity, we'll insert at current cursor or end
                        const cursorPos = textarea.selectionStart ?? currentValue.length
                        const before = currentValue.substring(0, cursorPos)
                        const after = currentValue.substring(cursorPos)
                        const newValue = (before + variable + after).slice(0, 160)
                        
                        form.setValue('contenido', newValue, { shouldValidate: true })
                        
                        // Focus and set cursor after the variable
                        setTimeout(() => {
                          textarea.focus()
                          const newCursorPos = Math.min(cursorPos + variable.length, newValue.length)
                          textarea.selectionStart = textarea.selectionEnd = newCursorPos
                        }, 0)
                      }
                    }}
                    value={field.value}
                    disabled={field.disabled}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />

                {/* Autocomplete dropdown */}
                {localShowAutocomplete && localFilteredVariables.length > 0 && (
                  <VariableAutocomplete
                    variables={localFilteredVariables}
                    selectedIndex={selectedAutocompleteIndex}
                    onSelect={handleAutocompleteSelect}
                    onClose={() => setLocalShowAutocomplete(false)}
                    filter={localAutocompleteFilter}
                  />
                )}
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

      {/* Variables Panel */}
      {showVariablesPanel && (
        <div className="w-72 shrink-0 bg-white dark:bg-gray-900 rounded-lg border border-segal-blue/10 dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-4">
          <VariablesPanel onInsertVariable={handleInsertVariable} className="flex-1 min-h-0" />
        </div>
      )}
    </div>
  )
}
