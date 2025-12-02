/**
 * Diálogo para ver detalles completos de un flujo
 * Muestra información del flujo, sus etapas, estadísticas, estructura y historial de ejecuciones
 */

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Mail,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  GitBranch,
  Clock,
  Loader2,
  Trash2,
  Play,
} from 'lucide-react'
import { useFlujosDetail } from '@/features/flujos/hooks/useFlujosDetail'
import { flujosService } from '@/api/flujos.service'
import { FlujoStatisticsPanel } from './FlujoStatisticsPanel'
import { FlowStructurePanel } from './FlowStructurePanel'
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel'
import { ExecuteFlowModal } from './ExecuteFlowModal'
import type { FlujoNurturing, EtapaFlujo } from '@/types/flujo'

type TabType = 'general' | 'estructura' | 'estadisticas' | 'ejecuciones'

interface FlujoDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujo: FlujoNurturing | null
  onEdit?: () => void
  onDelete?: () => void
}

const TABS = [
  { id: 'general' as TabType, label: 'General', icon: AlertCircle },
  { id: 'estructura' as TabType, label: 'Estructura', icon: GitBranch },
  { id: 'estadisticas' as TabType, label: 'Estadísticas', icon: BarChart3 },
  { id: 'ejecuciones' as TabType, label: 'Ejecuciones', icon: Clock },
]

export function FlujoDetailDialog({
  open,
  onOpenChange,
  flujo: initialFlujo,
  onEdit,
  onDelete,
}: FlujoDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false)

  // Obtener flujo detallado del backend si está disponible
  const { data: detailedFlujo, isLoading } = useFlujosDetail(initialFlujo?.id || null, {
    enabled: open && initialFlujo !== null,
  })

  // Usar flujo detallado si está disponible, sino usar el flujo inicial
  const flujo = detailedFlujo || initialFlujo

  const handleDelete = async () => {
    if (!flujo?.id) {
      toast.error('Error: No se encontró el ID del flujo')
      return
    }

    setIsDeleting(true)
    try {
      const result = await flujosService.delete(flujo.id)
      toast.success(`Flujo "${flujo.nombre}" eliminado correctamente`, {
        description: result.mensaje || 'El flujo y todos sus datos asociados han sido eliminados',
      })
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onDelete?.()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error al eliminar el flujo'
      toast.error('Error al eliminar el flujo', {
        description: errorMessage,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!flujo) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-h-[90vh] bg-white border border-segal-blue/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-segal-blue/10 pb-4 shrink-0">
          <DialogTitle className="text-2xl font-bold text-segal-dark">
            {flujo.nombre || 'Detalles del Flujo'}
          </DialogTitle>
          <DialogDescription className="text-segal-dark/70">
            {flujo.descripcion || 'Información completa del flujo de nurturing'}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs Navigation */}
        <div className="border-b border-segal-blue/10 shrink-0 bg-segal-blue/2 px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-segal-blue text-segal-blue'
                      : 'border-transparent text-segal-dark/60 hover:text-segal-dark'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && initialFlujo?.id && detailedFlujo === undefined ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 text-segal-blue animate-spin" />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Tab: General */}
              {activeTab === 'general' && (
                <>
                  {/* Información básica */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1">Tipo de Deudor</p>
                      <p className="text-lg font-bold text-segal-dark">
                        {typeof flujo.tipo_prospecto === 'string'
                          ? flujo.tipo_prospecto
                          : flujo.tipo_prospecto?.nombre || 'Sin especificar'}
                      </p>
                    </div>

                    <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1">Estado</p>
                      <div className="flex items-center gap-2">
                        {flujo.activo ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-segal-green" />
                            <span className="text-lg font-bold text-segal-green">Activo</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-segal-red" />
                            <span className="text-lg font-bold text-segal-red">Inactivo</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Creado por
                      </p>
                      <p className="text-lg font-bold text-segal-dark">
                        {typeof flujo.user === 'string' ? flujo.user : flujo.user?.name || 'Sistema'}
                      </p>
                    </div>

                    <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Creado el
                      </p>
                      <p className="text-lg font-bold text-segal-dark">
                        {flujo.created_at ? new Date(flujo.created_at).toLocaleDateString('es-CL') : '-'}
                      </p>
                    </div>

                    {flujo.origen_id && (
                      <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                        <p className="text-sm text-segal-dark/60 font-semibold mb-1">Origen</p>
                        <p className="text-lg font-bold text-segal-dark">{flujo.origen || flujo.origen_id}</p>
                      </div>
                    )}

                    {flujo.canal_envio && (
                      <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                        <p className="text-sm text-segal-dark/60 font-semibold mb-1">Canal de Envío</p>
                        <p className="text-lg font-bold text-segal-dark capitalize">{flujo.canal_envio}</p>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  {flujo.descripcion && (
                    <div>
                      <p className="text-sm font-semibold text-segal-dark/60 mb-2">Descripción</p>
                      <p className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-4 text-segal-dark/80">
                        {flujo.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Etapas */}
                  <div>
                    <h3 className="text-lg font-bold text-segal-dark mb-4">
                      Etapas ({flujo.etapas?.length || flujo.flujo_etapas?.length || 0})
                    </h3>

                    {(flujo.etapas && flujo.etapas.length > 0) || (flujo.flujo_etapas && flujo.flujo_etapas.length > 0) ? (
                      <div className="space-y-3">
                        {(flujo.etapas || flujo.flujo_etapas || []).map((etapa: EtapaFlujo, index: number) => {
                          console.log('📋 Etapa detalle:', {
                            id: etapa.id,
                            dia_envio: etapa.dia_envio,
                            tipo_mensaje: etapa.tipo_mensaje,
                            allKeys: Object.keys(etapa),
                            etapaCompleta: etapa,
                          })
                          return (
                          <div
                            key={etapa.id || index}
                            className="bg-white border border-segal-blue/10 rounded-lg p-4 hover:border-segal-blue/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-segal-blue text-white text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <h4 className="text-sm font-bold text-segal-dark">
                                    Día {etapa.dia_envio} - {
                                      etapa.tipo_mensaje === 'email' ? '📧 Email' :
                                      etapa.tipo_mensaje === 'sms' ? '📱 SMS' :
                                      etapa.tipo_mensaje === 'ambos' ? '📧📱 Email + SMS' :
                                      '❓ Desconocido'
                                    }
                                  </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3 ml-11">
                                  {etapa.plantilla_mensaje && (
                                    <div>
                                      <p className="text-xs text-segal-dark/60">Plantilla</p>
                                      <p className="text-sm font-medium text-segal-dark">{etapa.plantilla_mensaje}</p>
                                    </div>
                                  )}

                                  {etapa.oferta && (
                                    <div>
                                      <p className="text-xs text-segal-dark/60">Oferta</p>
                                      <p className="text-sm font-medium text-segal-dark">{etapa.oferta.titulo}</p>
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
                                      ) : etapa.tipo_mensaje === 'sms' ? (
                                        <>
                                          <MessageSquare className="h-4 w-4 text-segal-blue" />
                                          <span className="text-sm font-medium text-segal-dark">SMS</span>
                                        </>
                                      ) : etapa.tipo_mensaje === 'ambos' ? (
                                        <>
                                          <Mail className="h-4 w-4 text-segal-blue" />
                                          <MessageSquare className="h-4 w-4 text-segal-blue" />
                                          <span className="text-sm font-medium text-segal-dark">Email + SMS</span>
                                        </>
                                      ) : (
                                        <span className="text-sm font-medium text-segal-dark/50">Desconocido</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {!etapa.activo && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold border border-red-200 rounded">
                                  Inactiva
                                </span>
                              )}
                            </div>
                          </div>
                        )
                        })}
                      </div>
                    ) : (
                      <div className="bg-segal-blue/5 border border-segal-blue/10 rounded-lg p-6 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-segal-blue/40 mb-2" />
                        <p className="text-segal-dark/60">No hay etapas configuradas</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tab: Estructura */}
              {activeTab === 'estructura' && (
                <FlowStructurePanel
                  etapas={flujo.etapas || flujo.flujo_etapas}
                  condiciones={flujo.flujo_condiciones}
                  ramificaciones={flujo.flujo_ramificaciones}
                  nodos_finales={flujo.flujo_nodos_finales}
                  config_structure={flujo.config_structure}
                  config_visual={flujo.config_visual}
                />
              )}

              {/* Tab: Estadísticas */}
              {activeTab === 'estadisticas' && (
                <FlujoStatisticsPanel estadisticas={flujo.estadisticas} />
              )}

              {/* Tab: Ejecuciones */}
              {activeTab === 'ejecuciones' && (
                <ExecutionHistoryPanel ejecuciones={flujo.flujo_ejecuciones} />
              )}
            </div>
          )}
        </div>

        {/* Footer - Botones de acción */}
        <div className="border-t border-segal-blue/10 shrink-0 bg-segal-blue/2 p-6 flex justify-between gap-3">
          {/* Delete button on the left */}
          {!showDeleteConfirm && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-segal-red/20 text-segal-red hover:bg-segal-red/5"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}

          {/* Delete confirmation buttons */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-segal-red font-medium">¿Eliminar este flujo?</span>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-segal-red hover:bg-segal-red/90 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Sí, eliminar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Other buttons on the right */}
          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
              disabled={showDeleteConfirm}
            >
              Cerrar
            </Button>

            {onEdit && (
              <Button
                onClick={() => {
                  onEdit()
                  onOpenChange(false)
                }}
                className="bg-segal-blue hover:bg-segal-blue/90 text-white"
                disabled={showDeleteConfirm}
              >
                Editar
              </Button>
            )}

            <Button
              onClick={() => setIsExecuteModalOpen(true)}
              className="bg-segal-green hover:bg-segal-green/90 text-white"
              disabled={showDeleteConfirm}
            >
              <Play className="h-4 w-4 mr-2" />
              Ejecutar Flujo
            </Button>
          </div>
        </div>

        {/* Execute Flow Modal */}
        <ExecuteFlowModal
          flujo={flujo}
          isOpen={isExecuteModalOpen}
          onClose={() => setIsExecuteModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
