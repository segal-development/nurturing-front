/**
 * Panel para visualizar la estructura del flujo
 * Muestra el flujo visualmente con ReactFlow si está disponible
 * Sino, muestra etapas, condiciones, ramificaciones y nodos finales en formato texto
 */

import { useState } from 'react'
import { ArrowRight, GitBranch, CheckCircle2, AlertCircle, Eye, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlowVisualizationViewer } from './FlowVisualizationViewer'
import type { EtapaFlujo, CondicionFlujo, RamificacionFlujo, NodoFinalFlujo, ConfigStructure, ConfigVisual } from '@/types/flujo'

interface FlowStructurePanelProps {
  etapas?: EtapaFlujo[]
  condiciones?: CondicionFlujo[]
  ramificaciones?: RamificacionFlujo[]
  nodos_finales?: NodoFinalFlujo[]
  config_structure?: ConfigStructure
  config_visual?: ConfigVisual
}

export function FlowStructurePanel({
  etapas,
  condiciones,
  ramificaciones,
  nodos_finales,
  config_structure,
  config_visual,
}: FlowStructurePanelProps) {
  // Verificar si hay visualización disponible desde el principio
  const hasVisualData = config_visual && config_visual.nodes && config_visual.nodes.length > 0
  const [viewMode, setViewMode] = useState<'visual' | 'details'>(hasVisualData ? 'visual' : 'details')

  // Usar config_structure si está disponible, sino usar los campos individuales
  const stages = config_structure?.stages || etapas || []
  const conditions = config_structure?.conditions || condiciones || []
  const branches = config_structure?.branches || ramificaciones || []
  const endNodes = config_structure?.end_nodes || nodos_finales || []

  // Verificar si hay visualización disponible
  const hasVisual = config_visual && config_visual.nodes && config_visual.nodes.length > 0
  const hasStructure = stages.length > 0 || conditions.length > 0 || branches.length > 0 || endNodes.length > 0

  return (
    <div className="space-y-4">
      {/* Toggle entre vistas si ambas están disponibles */}
      {(hasVisual || hasStructure) && (
        <div className="flex gap-2">
          {hasVisual && (
            <Button
              onClick={() => setViewMode('visual')}
              variant={viewMode === 'visual' ? 'default' : 'outline'}
              size="sm"
              className={`flex items-center gap-2 ${
                viewMode === 'visual'
                  ? 'bg-segal-blue text-white'
                  : 'border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5'
              }`}
            >
              <Eye className="h-4 w-4" />
              Vista Visual
            </Button>
          )}
          {hasStructure && (
            <Button
              onClick={() => setViewMode('details')}
              variant={viewMode === 'details' ? 'default' : 'outline'}
              size="sm"
              className={`flex items-center gap-2 ${
                viewMode === 'details'
                  ? 'bg-segal-blue text-white'
                  : 'border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5'
              }`}
            >
              <List className="h-4 w-4" />
              Detalles
            </Button>
          )}
        </div>
      )}

      {/* Vista Visual - ReactFlow */}
      {viewMode === 'visual' && (
        <div>
          {hasVisual ? (
            <FlowVisualizationViewer configVisual={config_visual} />
          ) : (
            <div className="w-full h-[700px] bg-segal-blue/5 border border-dashed border-segal-blue/20 rounded-lg flex flex-col items-center justify-center">
              <AlertCircle className="h-12 w-12 text-segal-blue/40 mb-3" />
              <p className="text-segal-dark/60 font-medium">No hay visualización disponible</p>
              <p className="text-sm text-segal-dark/40 mt-1">Este flujo no tiene configuración visual almacenada</p>
              {hasStructure && (
                <p className="text-sm text-segal-blue mt-4">💡 Puedes ver los detalles en la pestaña "Detalles"</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vista de Detalles - Estructura de texto */}
      {viewMode === 'details' && (
        <div className="space-y-6">
          {/* Etapas */}
          <div>
            <h3 className="text-lg font-bold text-segal-dark mb-4">Etapas ({stages.length})</h3>

            {stages && stages.length > 0 ? (
              <div className="space-y-3">
                {stages.map((etapa, index) => (
                  <div
                    key={etapa.id}
                    className="bg-white border border-segal-blue/10 rounded-lg p-4 hover:border-segal-blue/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-segal-blue text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <h4 className="font-semibold text-segal-dark">
                            Día {etapa.dia_envio} - {
                              etapa.tipo_mensaje === 'email' ? '📧 Email' :
                              etapa.tipo_mensaje === 'sms' ? '📱 SMS' :
                              etapa.tipo_mensaje === 'ambos' ? '📧📱 Email + SMS' :
                              '❓ Desconocido'
                            }
                          </h4>
                        </div>

                        {etapa.plantilla_mensaje && (
                          <p className="text-sm text-segal-dark/70 ml-11">
                            <span className="font-medium">Mensaje:</span> {etapa.plantilla_mensaje}
                          </p>
                        )}

                        {etapa.oferta && (
                          <p className="text-sm text-segal-dark/70 ml-11">
                            <span className="font-medium">Oferta:</span> {etapa.oferta.titulo}
                          </p>
                        )}
                      </div>

                      {!etapa.activo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold border border-red-200 rounded">
                          Inactiva
                        </span>
                      )}
                    </div>

                    {index < stages.length - 1 && (
                      <div className="flex items-center justify-center mt-3">
                        <ArrowRight className="h-4 w-4 text-segal-blue/40 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-segal-blue/40 mb-2" />
                <p className="text-segal-dark/60">No hay etapas configuradas</p>
              </div>
            )}
          </div>

          {/* Condiciones */}
          {conditions && conditions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-segal-blue" />
                Condiciones ({conditions.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {conditions.map((condicion) => (
                  <div key={condicion.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-blue-900 mb-1">{condicion.tipo}</p>
                    {condicion.descripcion && (
                      <p className="text-sm text-blue-700">{condicion.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ramificaciones */}
          {branches && branches.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-segal-blue" />
                Ramificaciones ({branches.length})
              </h3>

              <div className="space-y-2">
                {branches.map((rama) => (
                  <div key={rama.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-900">
                          Nodo {rama.nodo_origen_id} → Nodo {rama.nodo_destino_id}
                        </p>
                        {rama.etiqueta && (
                          <p className="text-xs text-purple-700 mt-1">Etiqueta: {rama.etiqueta}</p>
                        )}
                      </div>
                      {rama.condicion_id && (
                        <span className="text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded">
                          Condición {rama.condicion_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nodos Finales */}
          {endNodes && endNodes.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-segal-green" />
                Nodos Finales ({endNodes.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {endNodes.map((nodo: any) => {
                  console.log('📋 Nodo Final COMPLETO:', JSON.stringify(nodo, null, 2))
                  console.log('📋 Claves del nodo:', Object.keys(nodo))
                  // Intentar acceder a diferentes campos posibles
                  const label = nodo.label || nodo.tipo || nodo.nombre || nodo.title || 'Nodo Final'
                  const desc = nodo.descripcion || nodo.description || nodo.detalles || ''

                  return (
                  <div key={nodo.id} className="bg-segal-green/10 border border-segal-green/30 rounded-lg p-4">
                    <p className="font-semibold text-segal-green/90 mb-1">{label}</p>
                    {desc && (
                      <p className="text-sm text-segal-green/70">{desc}</p>
                    )}
                    {!desc && (
                      <p className="text-sm text-segal-green/50 italic">Sin descripción</p>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mensaje si no hay estructura */}
          {stages.length === 0 && conditions.length === 0 && branches.length === 0 && endNodes.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
              <AlertCircle className="h-12 w-12 text-segal-blue/40 mb-3" />
              <p className="text-segal-dark/60 font-medium">No hay estructura disponible</p>
              <p className="text-sm text-segal-dark/40 mt-1">Este flujo no tiene configuración de estructura</p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje si no hay nada */}
      {!hasVisual && !hasStructure && (
        <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
          <AlertCircle className="h-12 w-12 text-segal-blue/40 mb-3" />
          <p className="text-segal-dark/60 font-medium">No hay estructura disponible</p>
          <p className="text-sm text-segal-dark/40 mt-1">Este flujo no tiene configuración visual ni estructura</p>
        </div>
      )}
    </div>
  )
}
