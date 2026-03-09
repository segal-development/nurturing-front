/**
 * Diálogo para ver detalles completos de un flujo
 * Muestra información del flujo, sus etapas, estadísticas, estructura y historial de ejecuciones
 */

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
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
  Activity,
  Pause,
  UserPlus,
  RefreshCw,
} from 'lucide-react'
import { useFlujosDetail } from '@/features/flujos/hooks/useFlujosDetail'
import { useActiveExecution, useFlowExecutions, useLatestExecution, useFlowExecutionDetail } from '@/features/flujos/hooks/useFlowExecutionTracking'
import { flujosService } from '@/api/flujos.service'
import { FlujoStatisticsPanel } from './FlujoStatisticsPanel'
import { FlowStructurePanel } from './FlowStructurePanel'
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel'
import { ExecuteFlowModal } from './ExecuteFlowModal'
import { FlowExecutionViewer } from './FlowExecutionViewer'
import { AddProspectsModal } from './AddProspectsModal'
import type { FlujoNurturing, EtapaFlujo } from '@/types/flujo'
import { getCanalEnvioReal, getCanalEnvioLabel, getCanalEnvioIcon } from '@/types/flujo'

type TabType = 'general' | 'estructura' | 'estadisticas' | 'ejecuciones' | 'monitoreo'

interface FlujoDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flujo: FlujoNurturing | null
  onEdit?: () => void
  onDelete?: () => void
  executionId?: string
  onExecutionStart?: (ejecucionId: number) => void
}

const TABS = [
  { id: 'general' as TabType, label: 'General', icon: AlertCircle },
  { id: 'estructura' as TabType, label: 'Estructura', icon: GitBranch },
  { id: 'estadisticas' as TabType, label: 'Estadísticas', icon: BarChart3 },
  { id: 'ejecuciones' as TabType, label: 'Ejecuciones', icon: Clock },
  { id: 'monitoreo' as TabType, label: 'Monitoreo', icon: Activity },
]

export function FlujoDetailDialog({
  open,
  onOpenChange,
  flujo: initialFlujo,
  onEdit,
  onDelete,
  executionId,
  onExecutionStart,
}: FlujoDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false)
  const [isAddProspectsModalOpen, setIsAddProspectsModalOpen] = useState(false)
  const [isTogglingAutoAsignar, setIsTogglingAutoAsignar] = useState(false)

  // Obtener flujo detallado del backend si está disponible
  const { data: detailedFlujo, isLoading, refetch: refetchFlujo } = useFlujosDetail(initialFlujo?.id || null, {
    enabled: open && initialFlujo !== null,
  })

  // Verificar si hay una ejecución activa
  const { data: activeExecutionData, isLoading: isLoadingActiveExecution } = useActiveExecution(
    initialFlujo?.id || 0,
    open && !!initialFlujo?.id,
  )

  // Obtener todas las ejecuciones del flujo para la pestaña "Ejecuciones"
  const { data: executionsData, isLoading: isLoadingExecutions, error: executionsError, isError: isExecutionsError, refetch: refetchExecutions } = useFlowExecutions(
    initialFlujo?.id || 0,
    50, // Últimas 50 ejecuciones
  )

  // DEBUG: Ver estado de las ejecuciones
  useEffect(() => {
    if (open) {
      logger.log('[FlujoDetailDialog] Executions Debug:', {
        flujoId: initialFlujo?.id,
        isLoadingExecutions,
        isExecutionsError,
        executionsError,
        executionsData,
        executionsDataType: typeof executionsData,
        hasData: !!executionsData?.data,
        dataLength: executionsData?.data?.length,
        rawData: executionsData?.data,
      })
    }
  }, [open, initialFlujo?.id, isLoadingExecutions, isExecutionsError, executionsError, executionsData])

  // Obtener la última ejecución para mostrar estado en etapas del tab General
  const { data: latestExecutionData } = useLatestExecution(
    initialFlujo?.id || 0,
    false,
  )

  // Obtener detalles de la última ejecución (incluye estado de cada etapa)
  const latestExecutionId = latestExecutionData?.data?.[0]?.id
  const { data: latestExecutionDetail } = useFlowExecutionDetail(
    initialFlujo?.id || 0,
    latestExecutionId || 0,
    !!latestExecutionId,
  )

  // Usar flujo detallado si está disponible, sino usar el flujo inicial
  const flujo = detailedFlujo || initialFlujo

  // Crear un mapa de estados de etapas por node_id para el tab General
  // El node_id en config_visual tiene formato "stage_X" donde X es el ID de la etapa
  const etapaStatesMap = (() => {
    const map = new Map<string, { estado: string; enviados?: number; fallidos?: number }>()

    if (latestExecutionDetail?.data?.etapas) {
      latestExecutionDetail.data.etapas.forEach(etapa => {
        // Guardar por node_id para coincidencia con ReactFlow
        map.set(etapa.node_id, {
          estado: etapa.estado,
          enviados: etapa.envios?.enviado || 0,
          fallidos: etapa.envios?.fallido || 0,
        })

        // También guardar por ID de etapa (formato "stage_123")
        // Extraer el ID numérico del node_id si tiene formato "stage_X"
        const idMatch = etapa.node_id.match(/stage[_-](\d+)/)
        if (idMatch) {
          map.set(idMatch[1], {
            estado: etapa.estado,
            enviados: etapa.envios?.enviado || 0,
            fallidos: etapa.envios?.fallido || 0,
          })
        }
      })
    }

    return map
  })()

  // Determinar si hay una ejecución activa
  const hasActiveExecution = activeExecutionData?.tiene_ejecucion_activa || false
  const activeExecution = activeExecutionData?.ejecucion || null

  // Determinar si el flujo ya fue ejecutado exitosamente (completed)
  const latestExecution = latestExecutionData?.data?.[0]
  const hasCompletedExecution = latestExecution?.estado === 'completed'
  const hasFailedExecution = latestExecution?.estado === 'failed'
  const hasCancelledExecution = latestExecution?.estado === 'cancelled'

  // Determinar si el flujo tiene prospectos
  const prospectoCount = flujo?.prospectos_en_flujo_count ?? flujo?.prospectos_en_flujo?.length ?? 0
  const hasProspects = prospectoCount > 0

  // DEBUG: Ver qué responde el backend
  useEffect(() => {
    if (activeExecutionData && open) {
      logger.log('[FlujoDetailDialog] Active Execution Response:', {
        tiene_ejecucion_activa: activeExecutionData.tiene_ejecucion_activa,
        ejecucion: activeExecutionData.ejecucion,
        flujoId: initialFlujo?.id,
      })
    }
  }, [activeExecutionData, open, initialFlujo?.id])

  // Determinar el execution ID efectivo: priorizar el activo del backend sobre el prop
  const effectiveExecutionId = activeExecution?.id
    ? activeExecution.id.toString()
    : executionId || undefined

  // DEBUG: Ver el execution ID efectivo
  useEffect(() => {
    if (open) {
      logger.log('[FlujoDetailDialog] Execution IDs:', {
        effectiveExecutionId,
        hasActiveExecution,
        activeExecutionId: activeExecution?.id,
        propExecutionId: executionId,
        currentTab: activeTab,
      })
    }
  }, [effectiveExecutionId, hasActiveExecution, activeExecution?.id, executionId, open, activeTab])

  // Auto-switch to estructura tab when execution starts
  useEffect(() => {
    if (effectiveExecutionId && open) {
      logger.log('[FlujoDetailDialog] Auto-switching to estructura tab')
      setActiveTab('estructura')
    }
  }, [effectiveExecutionId, open])

  // Auto-switch to estructura tab when active execution is detected
  useEffect(() => {
    if (hasActiveExecution && activeExecution && open) {
      setActiveTab('estructura')
      // Notificar al padre que hay una ejecución activa
      if (onExecutionStart && activeExecution.id) {
        onExecutionStart(activeExecution.id)
      }
    }
  }, [hasActiveExecution, activeExecution, open, onExecutionStart])

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

  const handleToggleAutoAsignar = async () => {
    if (!flujo?.id) return

    const newValue = !flujo.auto_asignar_nuevos
    setIsTogglingAutoAsignar(true)
    
    try {
      await flujosService.toggleAutoAsignar(flujo.id, newValue)
      toast.success(
        newValue 
          ? 'Auto-asignación activada' 
          : 'Auto-asignación desactivada',
        {
          description: newValue 
            ? 'Los nuevos prospectos se agregarán automáticamente cada viernes'
            : 'Los nuevos prospectos ya no se agregarán automáticamente',
        }
      )
      // Refrescar datos del flujo
      refetchFlujo()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cambiar configuración'
      toast.error('Error al cambiar auto-asignación', {
        description: errorMessage,
      })
    } finally {
      setIsTogglingAutoAsignar(false)
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

                    <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1">Canal de Envío</p>
                      <p className="text-lg font-bold text-segal-dark">
                        {getCanalEnvioIcon(getCanalEnvioReal(flujo))} {getCanalEnvioLabel(getCanalEnvioReal(flujo))}
                      </p>
                    </div>

                    {/* Prospectos count */}
                    <div className={`rounded-lg p-4 border ${hasProspects ? 'bg-segal-blue/5 border-segal-blue/10' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Prospectos
                      </p>
                      <p className={`text-lg font-bold ${hasProspects ? 'text-segal-dark' : 'text-amber-600'}`}>
                        {prospectoCount.toLocaleString()}
                      </p>
                    </div>

                    {/* Auto-asignación de nuevos prospectos - Clickeable */}
                    <button
                      onClick={handleToggleAutoAsignar}
                      disabled={isTogglingAutoAsignar}
                      className={`rounded-lg p-4 border text-left transition-all hover:shadow-md ${
                        flujo.auto_asignar_nuevos 
                          ? 'bg-segal-green/5 border-segal-green/20 hover:border-segal-green/40' 
                          : 'bg-segal-blue/5 border-segal-blue/10 hover:border-segal-blue/30'
                      } ${isTogglingAutoAsignar ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <p className="text-sm text-segal-dark/60 font-semibold mb-1 flex items-center gap-2">
                        <RefreshCw className={`h-4 w-4 ${isTogglingAutoAsignar ? 'animate-spin' : ''}`} />
                        Auto-asignación
                      </p>
                      <div className="flex items-center gap-2">
                        {flujo.auto_asignar_nuevos ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-segal-green" />
                            <span className="text-lg font-bold text-segal-green">Activa</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-segal-dark/40" />
                            <span className="text-lg font-bold text-segal-dark/60">Inactiva</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-segal-dark/50 mt-1">Click para cambiar</p>
                    </button>
                  </div>

                  {/* Info: Auto-asignación explicación */}
                  {flujo.auto_asignar_nuevos && (
                    <div className="p-4 rounded-lg bg-segal-green/5 border border-segal-green/20 flex items-start gap-3">
                      <RefreshCw className="h-5 w-5 text-segal-green shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-segal-dark">Auto-asignación activa</p>
                        <p className="text-sm text-segal-dark/70 mt-1">
                          Cada viernes después del sync, los nuevos prospectos del origen "{flujo.origen}" se agregarán automáticamente a este flujo, empezando desde la Etapa 1.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Alert: No prospects */}
                  {!hasProspects && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900">Este flujo no tiene prospectos</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Agrega prospectos para poder ejecutar el flujo. Puedes hacerlo desde el botón "Agregar Prospectos" en la parte inferior.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddProspectsModalOpen(true)}
                          className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Agregar Prospectos
                        </Button>
                      </div>
                    </div>
                  )}

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
                          // Buscar estado de esta etapa en la última ejecución
                          const etapaState = etapaStatesMap.get(String(etapa.id))

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

                                  {/* Badge de estado de ejecución */}
                                  {etapaState && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${
                                      etapaState.estado === 'completed' ? 'bg-green-100 text-green-700' :
                                      etapaState.estado === 'executing' ? 'bg-amber-100 text-amber-700' :
                                      etapaState.estado === 'failed' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {etapaState.estado === 'completed' && '✅ Ejecutada'}
                                      {etapaState.estado === 'executing' && '⚙️ En ejecución'}
                                      {etapaState.estado === 'failed' && '❌ Fallida'}
                                      {etapaState.estado === 'pending' && '⏳ Pendiente'}
                                      {etapaState.enviados && etapaState.enviados > 0 && ` (${etapaState.enviados})`}
                                    </span>
                                  )}
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
                  flujoId={flujo?.id}
                  executionId={effectiveExecutionId}
                  prospectosCount={flujo.prospectos_en_flujo_count}
                />
              )}

              {/* Tab: Estadísticas */}
              {activeTab === 'estadisticas' && (
                <FlujoStatisticsPanel flujoId={flujo?.id} />
              )}

              {/* Tab: Ejecuciones */}
              {activeTab === 'ejecuciones' && (
                <ExecutionHistoryPanel
                  ejecuciones={executionsData?.data}
                  isLoading={isLoadingExecutions}
                  configVisual={flujo?.config_visual}
                  onViewExecution={(ejecucionId) => {
                    // Navegar al tab de Monitoreo con la ejecución seleccionada
                    setActiveTab('monitoreo')
                    if (onExecutionStart) {
                      onExecutionStart(ejecucionId)
                    }
                  }}
                  onRefresh={() => refetchExecutions()}
                />
              )}

              {/* Tab: Monitoreo - Real-time execution monitoring with visual flow */}
              {activeTab === 'monitoreo' && effectiveExecutionId && flujo?.id && (
                <FlowExecutionViewer
                  flujoId={flujo.id}
                  ejecucionId={parseInt(effectiveExecutionId)}
                  configVisual={flujo.config_visual}
                />
              )}

              {/* Monitoreo - No active execution */}
              {activeTab === 'monitoreo' && !effectiveExecutionId && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-segal-blue/30 mx-auto mb-4" />
                    <p className="text-segal-dark/60 dark:text-slate-400">
                      No hay una ejecución activa en monitoreo
                    </p>
                    <p className="text-sm text-segal-dark/40 dark:text-slate-500 mt-2">
                      Ejecuta el flujo para ver el monitoreo visual en tiempo real
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Botones de acción */}
        <div className="border-t border-segal-blue/10 shrink-0 bg-segal-blue/2 p-6 flex justify-between gap-3">
          {/* Delete button on the left */}
          {!showDeleteConfirm && (
            <div className="relative group">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={hasActiveExecution}
                className={`border-segal-red/20 text-segal-red hover:bg-segal-red/5 ${
                  hasActiveExecution ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              {/* Tooltip cuando está deshabilitado */}
              {hasActiveExecution && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  No se puede eliminar un flujo en ejecución
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
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
              <div className="relative group">
                <Button
                  onClick={() => {
                    onEdit()
                    onOpenChange(false)
                  }}
                  className="bg-segal-blue hover:bg-segal-blue/90 text-white"
                  disabled={showDeleteConfirm || hasActiveExecution}
                >
                  Editar
                </Button>
                {/* Tooltip cuando está deshabilitado por ejecución activa */}
                {hasActiveExecution && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    No se puede editar durante una ejecución
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            )}

            {/* Botón de Ejecutar o Estado de Ejecución */}
            {hasActiveExecution && activeExecution ? (
              // Ejecución activa (in_progress o paused) - Solo informativo, no clickeable
              <Button
                className="bg-amber-500 text-white cursor-default pointer-events-none opacity-90"
                disabled
              >
                {activeExecution.estado === 'in_progress' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ejecución en Progreso
                  </>
                ) : activeExecution.estado === 'paused' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Ejecución Pausada
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Ver Ejecución
                  </>
                )}
              </Button>
            ) : hasCompletedExecution ? (
              // Flujo ya completado exitosamente - NO se puede volver a ejecutar
              <Button
                onClick={() => setActiveTab('ejecuciones')}
                className="bg-green-600 hover:bg-green-700 text-white cursor-default"
                disabled={showDeleteConfirm}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Flujo Completado
              </Button>
            ) : (
              // Flujo disponible para ejecutar (nunca ejecutado, fallido o cancelado)
              <>
                {/* Botón para agregar prospectos si no tiene */}
                {!hasProspects && !hasActiveExecution && (
                  <Button
                    onClick={() => setIsAddProspectsModalOpen(true)}
                    variant="outline"
                    className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
                    disabled={showDeleteConfirm}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Prospectos
                  </Button>
                )}
                <Button
                  onClick={() => setIsExecuteModalOpen(true)}
                  className="bg-segal-green hover:bg-segal-green/90 text-white"
                  disabled={showDeleteConfirm || isLoadingActiveExecution || !hasProspects}
                  title={!hasProspects ? 'Agrega prospectos antes de ejecutar' : undefined}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {hasFailedExecution || hasCancelledExecution ? 'Re-ejecutar Flujo' : 'Ejecutar Flujo'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Execute Flow Modal */}
        <ExecuteFlowModal
          flujo={flujo}
          isOpen={isExecuteModalOpen}
          onClose={() => setIsExecuteModalOpen(false)}
          onExecuteSuccess={(ejecucionId) => {
            setIsExecuteModalOpen(false)
            onExecutionStart?.(ejecucionId)
          }}
        />

        {/* Add Prospects Modal */}
        <AddProspectsModal
          flujo={flujo}
          isOpen={isAddProspectsModalOpen}
          onClose={() => setIsAddProspectsModalOpen(false)}
          onSuccess={() => {
            // Invalidate queries to refresh prospect count
            // This will be handled by the parent component refreshing the flujo data
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
