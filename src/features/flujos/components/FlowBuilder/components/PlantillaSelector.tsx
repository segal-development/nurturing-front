/**
 * Selector de plantillas para nodos de etapa
 * Permite elegir entre plantillas guardadas o escribir contenido inline
 * Soporta SMS, Email, y ambos tipos
 */

import { useState, useMemo } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { usePlantillasSMS, usePlantillasEmail } from '@/features/flujos/hooks/usePlantillas'
import type { PlantillaSMS, PlantillaEmail } from '@/types/plantilla'
import type { TipoMensaje } from '@/types/flujo'

interface PlantillaSelectorProps {
  tipo_mensaje?: TipoMensaje // 'sms' | 'email' | 'ambos'
  plantilla_id?: number // ID de la plantilla seleccionada
  plantilla_id_email?: number // Para 'ambos': ID de plantilla email
  plantilla_mensaje?: string // Fallback: contenido inline
  plantilla_type?: 'reference' | 'inline' // Tipo actual
  onChange: (data: {
    plantilla_id?: number
    plantilla_id_email?: number
    plantilla_mensaje?: string
    plantilla_type?: 'reference' | 'inline'
  }) => void
}

export function PlantillaSelector({
  tipo_mensaje,
  plantilla_id,
  plantilla_id_email,
  plantilla_mensaje,
  plantilla_type,
  onChange,
}: PlantillaSelectorProps) {
  const [showInlineEditor, setShowInlineEditor] = useState(
    plantilla_type === 'inline' || !plantilla_id
  )

  // Cargar plantillas según el tipo de mensaje
  const { data: plantillasSMS = [], isLoading: loadingSMS } = usePlantillasSMS(
    tipo_mensaje === 'sms' || tipo_mensaje === 'ambos'
  )
  const { data: plantillasEmail = [], isLoading: loadingEmail } = usePlantillasEmail(
    tipo_mensaje === 'email' || tipo_mensaje === 'ambos'
  )

  // Obtener plantilla seleccionada actual
  const plantillaSeleccionada = useMemo(() => {
    if (tipo_mensaje === 'sms' || tipo_mensaje === 'ambos') {
      return plantillasSMS.find((p) => p.id === plantilla_id)
    }
    if (tipo_mensaje === 'email') {
      return plantillasEmail.find((p) => p.id === plantilla_id)
    }
    return null
  }, [plantilla_id, plantillasSMS, plantillasEmail, tipo_mensaje])

  const plantillaEmailSeleccionada = useMemo(() => {
    if (tipo_mensaje === 'ambos' && plantilla_id_email) {
      return plantillasEmail.find((p) => p.id === plantilla_id_email)
    }
    return null
  }, [plantilla_id_email, plantillasEmail, tipo_mensaje])

  const handleSelectPlantilla = (plantilla: PlantillaSMS | PlantillaEmail) => {
    onChange({
      plantilla_id: plantilla.id,
      plantilla_type: 'reference',
      plantilla_mensaje: undefined, // Limpiar inline
    })
    setShowInlineEditor(false)
  }

  const handleSelectEmailPlantilla = (plantilla: PlantillaEmail) => {
    onChange({
      plantilla_id_email: plantilla.id,
      plantilla_type: 'reference',
    })
  }

  const handleInlineChange = (contenido: string) => {
    onChange({
      plantilla_mensaje: contenido,
      plantilla_type: 'inline',
      plantilla_id: undefined, // Limpiar referencia
      plantilla_id_email: undefined,
    })
  }

  const handleClearPlantilla = () => {
    onChange({
      plantilla_id: undefined,
      plantilla_id_email: undefined,
      plantilla_mensaje: '',
      plantilla_type: 'inline',
    })
    setShowInlineEditor(true)
  }

  const isLoading = loadingSMS || loadingEmail

  if (!tipo_mensaje) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        Selecciona un tipo de mensaje primero (SMS, Email o Ambos)
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Modo: Referencia o Inline */}
      <div className="flex gap-2 border-b border-segal-blue/10 pb-3">
        <button
          onClick={() => setShowInlineEditor(false)}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            !showInlineEditor
              ? 'bg-segal-blue text-white'
              : 'bg-segal-blue/5 text-segal-dark hover:bg-segal-blue/10'
          }`}
        >
          Plantillas Guardadas
        </button>
        <button
          onClick={() => setShowInlineEditor(true)}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            showInlineEditor
              ? 'bg-segal-blue text-white'
              : 'bg-segal-blue/5 text-segal-dark hover:bg-segal-blue/10'
          }`}
        >
          Escribir Contenido
        </button>
      </div>

      {/* Editor Inline */}
      {showInlineEditor ? (
        <div className="space-y-2">
          <Textarea
            placeholder={
              tipo_mensaje === 'sms'
                ? 'Escribe tu mensaje SMS (máximo 160 caracteres)...'
                : 'Escribe tu mensaje de email...'
            }
            value={plantilla_mensaje || ''}
            onChange={(e) => handleInlineChange(e.target.value)}
            maxLength={tipo_mensaje === 'sms' ? 160 : undefined}
            className="min-h-24 border-segal-blue/30"
          />
          {tipo_mensaje === 'sms' && (
            <p className="text-xs text-segal-dark/60">
              {(plantilla_mensaje || '').length}/160 caracteres
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Selector SMS (si corresponde) */}
          {(tipo_mensaje === 'sms' || tipo_mensaje === 'ambos') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-segal-dark">
                {tipo_mensaje === 'ambos' ? '📱 Plantilla SMS' : 'Plantilla'}
              </label>

              {isLoading ? (
                <div className="p-3 bg-segal-blue/5 rounded text-xs text-segal-dark/60">
                  Cargando plantillas...
                </div>
              ) : plantillasSMS.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  No hay plantillas SMS disponibles
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Plantilla seleccionada */}
                  {plantillaSeleccionada && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900">
                            ✓ {plantillaSeleccionada.nombre}
                          </p>
                          <p className="text-xs text-green-800 mt-1">
                            {plantillaSeleccionada.descripcion}
                          </p>
                          {plantillaSeleccionada.tipo === 'sms' && (
                            <p className="text-xs text-green-700 mt-2 line-clamp-2">
                              "{(plantillaSeleccionada as PlantillaSMS).contenido}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleClearPlantilla}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                          title="Cambiar plantilla"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dropdown de plantillas */}
                  {!plantillaSeleccionada && (
                    <div className="relative group">
                      <button className="w-full px-3 py-2 border border-segal-blue/30 rounded bg-white text-segal-dark text-sm flex items-center justify-between hover:border-segal-blue/50 transition-colors">
                        <span>Seleccionar plantilla SMS</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-segal-blue/20 rounded shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div className="max-h-48 overflow-y-auto">
                          {plantillasSMS.map((plantilla) => (
                            <button
                              key={plantilla.id}
                              onClick={() => handleSelectPlantilla(plantilla)}
                              className="w-full text-left px-3 py-2 hover:bg-segal-blue/5 border-b border-segal-blue/10 last:border-0 transition-colors"
                            >
                              <p className="text-sm font-medium text-segal-dark">
                                {plantilla.nombre}
                              </p>
                              {plantilla.descripcion && (
                                <p className="text-xs text-segal-dark/60">
                                  {plantilla.descripcion}
                                </p>
                              )}
                              <p className="text-xs text-segal-dark/50 mt-1 line-clamp-1">
                                "{plantilla.contenido.substring(0, 50)}..."
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selector Email (si corresponde) */}
          {(tipo_mensaje === 'email' || tipo_mensaje === 'ambos') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-segal-dark">
                {tipo_mensaje === 'ambos' ? '📧 Plantilla Email' : 'Plantilla'}
              </label>

              {isLoading ? (
                <div className="p-3 bg-segal-blue/5 rounded text-xs text-segal-dark/60">
                  Cargando plantillas...
                </div>
              ) : plantillasEmail.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  No hay plantillas Email disponibles
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Plantilla seleccionada */}
                  {plantillaEmailSeleccionada && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-purple-900">
                            ✓ {plantillaEmailSeleccionada.nombre}
                          </p>
                          <p className="text-xs text-purple-800 mt-1">
                            Asunto: {plantillaEmailSeleccionada.asunto}
                          </p>
                          <p className="text-xs text-purple-700 mt-2">
                            {plantillaEmailSeleccionada.componentes.length} componentes
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            onChange({
                              plantilla_id_email: undefined,
                            })
                          }
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                          title="Cambiar plantilla"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dropdown de plantillas */}
                  {!plantillaEmailSeleccionada && (
                    <div className="relative group">
                      <button className="w-full px-3 py-2 border border-segal-blue/30 rounded bg-white text-segal-dark text-sm flex items-center justify-between hover:border-segal-blue/50 transition-colors">
                        <span>Seleccionar plantilla Email</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-segal-blue/20 rounded shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div className="max-h-48 overflow-y-auto">
                          {plantillasEmail.map((plantilla) => (
                            <button
                              key={plantilla.id}
                              onClick={() => handleSelectEmailPlantilla(plantilla)}
                              className="w-full text-left px-3 py-2 hover:bg-segal-blue/5 border-b border-segal-blue/10 last:border-0 transition-colors"
                            >
                              <p className="text-sm font-medium text-segal-dark">
                                {plantilla.nombre}
                              </p>
                              {plantilla.descripcion && (
                                <p className="text-xs text-segal-dark/60">
                                  {plantilla.descripcion}
                                </p>
                              )}
                              <p className="text-xs text-segal-dark/50 mt-1">
                                Asunto: {plantilla.asunto}
                              </p>
                              <p className="text-xs text-segal-dark/40">
                                {plantilla.componentes.length} componentes
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
