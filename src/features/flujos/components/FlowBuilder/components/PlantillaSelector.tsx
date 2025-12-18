/**
 * PlantillaSelector - Selector de plantillas para nodos de etapa
 * 
 * Principios aplicados:
 * - SRP: Componentes pequeños con responsabilidad única
 * - OCP: Extensible para nuevos tipos de plantillas
 * - DIP: Depende de abstracciones (hooks) no implementaciones
 * - Early returns para reducir nesting
 * - Funciones pequeñas y reutilizables
 * - TypeScript estricto
 */

import { useState, useCallback, useMemo } from 'react'
import { AlertCircle, FileText, Mail, MessageSquare, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePlantillasSMS, usePlantillasEmail } from '@/features/flujos/hooks/usePlantillas'
import type { PlantillaSMS, PlantillaEmail, AnyPlantilla } from '@/types/plantilla'
import type { TipoMensaje } from '@/types/flujo'

// ============================================================================
// TYPES
// ============================================================================

interface PlantillaSelectorProps {
  tipo_mensaje?: TipoMensaje
  plantilla_id?: number
  plantilla_id_email?: number
  plantilla_mensaje?: string
  plantilla_type?: 'reference' | 'inline'
  onChange: (data: PlantillaSelectionData) => void
}

interface PlantillaSelectionData {
  plantilla_id?: number
  plantilla_id_email?: number
  plantilla_mensaje?: string
  plantilla_type?: 'reference' | 'inline'
}

type EditorMode = 'reference' | 'inline'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Trunca texto a una longitud máxima con ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Determina si debe cargar plantillas SMS basado en tipo_mensaje
 */
function shouldLoadSMS(tipo: TipoMensaje | undefined): boolean {
  return tipo === 'sms' || tipo === 'ambos'
}

/**
 * Determina si debe cargar plantillas Email basado en tipo_mensaje
 */
function shouldLoadEmail(tipo: TipoMensaje | undefined): boolean {
  return tipo === 'email' || tipo === 'ambos'
}

/**
 * Encuentra una plantilla por ID en una lista
 */
function findPlantillaById<T extends AnyPlantilla>(
  plantillas: T[],
  id: number | undefined
): T | undefined {
  if (!id) return undefined
  return plantillas.find((p) => p.id === id)
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Tabs para alternar entre modo referencia e inline
 */
interface ModeSelectorProps {
  currentMode: EditorMode
  onModeChange: (mode: EditorMode) => void
}

function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-2 border-b border-segal-blue/10 pb-3">
      <button
        type="button"
        onClick={() => onModeChange('reference')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
          currentMode === 'reference'
            ? 'bg-segal-blue text-white'
            : 'bg-segal-blue/5 text-segal-dark hover:bg-segal-blue/10'
        }`}
      >
        <FileText className="h-3 w-3 inline mr-1" />
        Plantillas Guardadas
      </button>
      <button
        type="button"
        onClick={() => onModeChange('inline')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
          currentMode === 'inline'
            ? 'bg-segal-blue text-white'
            : 'bg-segal-blue/5 text-segal-dark hover:bg-segal-blue/10'
        }`}
      >
        Escribir Contenido
      </button>
    </div>
  )
}

/**
 * Editor inline para escribir contenido directo
 */
interface InlineEditorProps {
  tipo_mensaje: TipoMensaje
  contenido: string
  onChange: (contenido: string) => void
}

function InlineEditor({ tipo_mensaje, contenido, onChange }: InlineEditorProps) {
  const isSMS = tipo_mensaje === 'sms'
  const maxLength = isSMS ? 160 : undefined
  const placeholder = isSMS
    ? 'Escribe tu mensaje SMS (máximo 160 caracteres)...'
    : 'Escribe tu mensaje de email...'

  return (
    <div className="space-y-2">
      <Textarea
        placeholder={placeholder}
        value={contenido}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="min-h-24 border-segal-blue/30 text-sm"
      />
      {isSMS && (
        <p className="text-xs text-segal-dark/60">
          {contenido.length}/160 caracteres
        </p>
      )}
    </div>
  )
}

/**
 * Estado de carga
 */
function LoadingState() {
  return (
    <div className="p-3 bg-segal-blue/5 rounded text-xs text-segal-dark/60 animate-pulse">
      Cargando plantillas...
    </div>
  )
}

/**
 * Estado de error
 */
interface ErrorStateProps {
  message: string
}

function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Estado vacío - no hay plantillas disponibles
 */
interface EmptyStateProps {
  tipo: 'sms' | 'email'
}

function EmptyState({ tipo }: EmptyStateProps) {
  const label = tipo === 'sms' ? 'SMS' : 'Email'
  return (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
      No hay plantillas {label} disponibles. Crea una en la sección de Plantillas.
    </div>
  )
}

/**
 * Muestra la plantilla seleccionada con opción de limpiar
 */
interface SelectedPlantillaCardProps {
  plantilla: PlantillaSMS | PlantillaEmail
  tipo: 'sms' | 'email'
  onClear: () => void
}

function SelectedPlantillaCard({ plantilla, tipo, onClear }: SelectedPlantillaCardProps) {
  const isSMS = tipo === 'sms'
  const bgClass = isSMS ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
  const textClass = isSMS ? 'text-green-900' : 'text-purple-900'
  const subTextClass = isSMS ? 'text-green-800' : 'text-purple-800'
  const iconClass = isSMS ? 'text-green-600' : 'text-purple-600'
  const Icon = isSMS ? MessageSquare : Mail

  return (
    <div className={`p-3 border rounded ${bgClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 flex-shrink-0 ${iconClass}`} />
            <p className={`text-sm font-semibold truncate ${textClass}`}>
              {plantilla.nombre}
            </p>
          </div>
          {plantilla.descripcion && (
            <p className={`text-xs mt-1 ${subTextClass}`}>
              {truncateText(plantilla.descripcion, 60)}
            </p>
          )}
          {isSMS && 'contenido' in plantilla && (
            <p className={`text-xs mt-2 line-clamp-2 ${subTextClass} opacity-80`}>
              "{truncateText(plantilla.contenido, 80)}"
            </p>
          )}
          {!isSMS && 'asunto' in plantilla && (
            <p className={`text-xs mt-2 ${subTextClass} opacity-80`}>
              Asunto: {truncateText(plantilla.asunto, 50)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className={`p-1 rounded transition-colors hover:bg-white/50 ${iconClass}`}
          title="Cambiar plantilla"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Select dropdown para elegir plantilla
 */
interface PlantillaSelectProps {
  plantillas: AnyPlantilla[]
  selectedId: number | undefined
  tipo: 'sms' | 'email'
  onSelect: (id: number) => void
}

function PlantillaSelect({ plantillas, selectedId, tipo, onSelect }: PlantillaSelectProps) {
  const label = tipo === 'sms' ? 'SMS' : 'Email'
  const Icon = tipo === 'sms' ? MessageSquare : Mail

  const handleValueChange = useCallback((value: string) => {
    const id = parseInt(value, 10)
    if (!isNaN(id)) {
      onSelect(id)
    }
  }, [onSelect])

  return (
    <Select
      value={selectedId?.toString() ?? ''}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={`Seleccionar plantilla ${label}`} />
      </SelectTrigger>
      <SelectContent>
        {plantillas.map((plantilla) => (
          <SelectItem key={plantilla.id} value={plantilla.id!.toString()}>
            <div className="flex items-center gap-2">
              <Icon className="h-3 w-3 text-segal-dark/50" />
              <span className="font-medium">{plantilla.nombre}</span>
              {plantilla.descripcion && (
                <span className="text-segal-dark/50 text-xs">
                  - {truncateText(plantilla.descripcion, 30)}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Sección de selección para un tipo específico (SMS o Email)
 */
interface PlantillaSectionProps {
  tipo: 'sms' | 'email'
  plantillas: AnyPlantilla[]
  selectedPlantilla: AnyPlantilla | undefined
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  showLabel: boolean
  onSelect: (id: number) => void
  onClear: () => void
}

function PlantillaSection({
  tipo,
  plantillas,
  selectedPlantilla,
  isLoading,
  isError,
  errorMessage,
  showLabel,
  onSelect,
  onClear,
}: PlantillaSectionProps) {
  const labelIcon = tipo === 'sms' ? '📱' : '📧'
  const labelText = tipo === 'sms' ? 'Plantilla SMS' : 'Plantilla Email'

  // Early return para loading
  if (isLoading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-xs font-semibold text-segal-dark">
            {labelIcon} {labelText}
          </label>
        )}
        <LoadingState />
      </div>
    )
  }

  // Early return para error
  if (isError) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-xs font-semibold text-segal-dark">
            {labelIcon} {labelText}
          </label>
        )}
        <ErrorState message={errorMessage ?? 'Error al cargar plantillas'} />
      </div>
    )
  }

  // Early return para lista vacía
  if (plantillas.length === 0) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-xs font-semibold text-segal-dark">
            {labelIcon} {labelText}
          </label>
        )}
        <EmptyState tipo={tipo} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-xs font-semibold text-segal-dark">
          {labelIcon} {labelText}
        </label>
      )}
      
      {selectedPlantilla ? (
        <SelectedPlantillaCard
          plantilla={selectedPlantilla as PlantillaSMS | PlantillaEmail}
          tipo={tipo}
          onClear={onClear}
        />
      ) : (
        <PlantillaSelect
          plantillas={plantillas}
          selectedId={undefined}
          tipo={tipo}
          onSelect={onSelect}
        />
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlantillaSelector({
  tipo_mensaje,
  plantilla_id,
  plantilla_id_email,
  plantilla_mensaje,
  plantilla_type,
  onChange,
}: PlantillaSelectorProps) {
  // Determine initial mode
  const initialMode: EditorMode = plantilla_type === 'inline' || (!plantilla_id && !plantilla_id_email)
    ? 'inline'
    : 'reference'
  
  const [mode, setMode] = useState<EditorMode>(initialMode)

  // Load plantillas based on tipo_mensaje
  const {
    data: plantillasSMS = [],
    isLoading: loadingSMS,
    isError: errorSMS,
    error: smsError,
  } = usePlantillasSMS(shouldLoadSMS(tipo_mensaje))

  const {
    data: plantillasEmail = [],
    isLoading: loadingEmail,
    isError: errorEmail,
    error: emailError,
  } = usePlantillasEmail(shouldLoadEmail(tipo_mensaje))

  // Find selected plantillas
  const selectedSMS = useMemo(
    () => findPlantillaById(plantillasSMS, plantilla_id),
    [plantillasSMS, plantilla_id]
  )

  const selectedEmail = useMemo(
    () => findPlantillaById(plantillasEmail, tipo_mensaje === 'email' ? plantilla_id : plantilla_id_email),
    [plantillasEmail, plantilla_id, plantilla_id_email, tipo_mensaje]
  )

  // Handlers
  const handleModeChange = useCallback((newMode: EditorMode) => {
    setMode(newMode)
    if (newMode === 'inline') {
      onChange({
        plantilla_id: undefined,
        plantilla_id_email: undefined,
        plantilla_mensaje: plantilla_mensaje ?? '',
        plantilla_type: 'inline',
      })
    }
  }, [onChange, plantilla_mensaje])

  const handleInlineChange = useCallback((contenido: string) => {
    onChange({
      plantilla_id: undefined,
      plantilla_id_email: undefined,
      plantilla_mensaje: contenido,
      plantilla_type: 'inline',
    })
  }, [onChange])

  const handleSelectSMS = useCallback((id: number) => {
    onChange({
      plantilla_id: id,
      plantilla_type: 'reference',
      plantilla_mensaje: undefined,
    })
  }, [onChange])

  const handleSelectEmail = useCallback((id: number) => {
    if (tipo_mensaje === 'ambos') {
      onChange({
        plantilla_id_email: id,
        plantilla_type: 'reference',
      })
    } else {
      onChange({
        plantilla_id: id,
        plantilla_type: 'reference',
        plantilla_mensaje: undefined,
      })
    }
  }, [onChange, tipo_mensaje])

  const handleClearSMS = useCallback(() => {
    onChange({
      plantilla_id: undefined,
      plantilla_type: tipo_mensaje === 'ambos' && plantilla_id_email ? 'reference' : 'inline',
    })
  }, [onChange, tipo_mensaje, plantilla_id_email])

  const handleClearEmail = useCallback(() => {
    if (tipo_mensaje === 'ambos') {
      onChange({
        plantilla_id_email: undefined,
        plantilla_type: plantilla_id ? 'reference' : 'inline',
      })
    } else {
      onChange({
        plantilla_id: undefined,
        plantilla_type: 'inline',
      })
    }
  }, [onChange, tipo_mensaje, plantilla_id])

  // Early return: no type selected
  if (!tipo_mensaje) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        Selecciona un tipo de mensaje primero (SMS, Email o Ambos)
      </div>
    )
  }

  const showSMS = shouldLoadSMS(tipo_mensaje)
  const showEmail = shouldLoadEmail(tipo_mensaje)
  const showBothLabels = tipo_mensaje === 'ambos'

  return (
    <div className="space-y-3">
      <ModeSelector currentMode={mode} onModeChange={handleModeChange} />

      {mode === 'inline' ? (
        <InlineEditor
          tipo_mensaje={tipo_mensaje}
          contenido={plantilla_mensaje ?? ''}
          onChange={handleInlineChange}
        />
      ) : (
        <div className="space-y-4">
          {showSMS && (
            <PlantillaSection
              tipo="sms"
              plantillas={plantillasSMS}
              selectedPlantilla={selectedSMS}
              isLoading={loadingSMS}
              isError={errorSMS}
              errorMessage={smsError?.message}
              showLabel={showBothLabels}
              onSelect={handleSelectSMS}
              onClear={handleClearSMS}
            />
          )}

          {showEmail && (
            <PlantillaSection
              tipo="email"
              plantillas={plantillasEmail}
              selectedPlantilla={selectedEmail}
              isLoading={loadingEmail}
              isError={errorEmail}
              errorMessage={emailError?.message}
              showLabel={showBothLabels}
              onSelect={handleSelectEmail}
              onClear={handleClearEmail}
            />
          )}
        </div>
      )}
    </div>
  )
}
