/**
 * ExecutionHistoryPanel
 *
 * Displays the execution history of a flow with expandable cards showing
 * the timeline of each stage/node execution.
 *
 * Features:
 * - Collapsible execution cards
 * - Stage timeline with status indicators
 * - Human-readable node labels from configVisual
 * - Duration and prospect count display
 * - **COHORT VIEW** for perpetual flows (auto_asignar_nuevos)
 *   - Groups executions as cohorts (entry date)
 *   - Shows progress per cohort with stage distribution
 *   - Visual progress bars and completion rates
 *
 * @module ExecutionHistoryPanel
 */

import { useState } from "react";
import { toast } from "sonner";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  GitBranch,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Users,
  Calendar,
  TrendingUp,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCurrency, useRecalcularCosto } from "@/features/costos/hooks";
import type {
  ExecutionListItem,
  ExecutionStageItem,
  CohorteActiva,
  CohortesActivasResponse,
} from "@/types/flowExecutionTracking";
import type { ConfigStructure, ConfigVisual } from "@/types/flujo";

import { CohortProspectDrawer } from "./CohortProspectDrawer";
import { EtapasHistoryTimeline } from "./EtapasHistoryTimeline";

import { useNodeLabelMap } from "../../hooks/useNodeLabelMap";
import {
  calculateExecutionDuration,
  formatExecutionDate,
  getExecutionStateColor,
  getExecutionStateIcon,
  getExecutionStateLabel,
} from "../../utils/executionStateHelpers";

// ============================================================================
// Types
// ============================================================================

interface ExecutionHistoryPanelProps {
  ejecuciones: ExecutionListItem[] | undefined;
  isLoading?: boolean;
  onViewExecution?: (ejecucionId: number) => void;
  onRefresh?: () => void;
  configVisual?: ConfigVisual;
  /** Config structure for stage label resolution in timeline */
  configStructure?: ConfigStructure;
  /** If true, renders cohort view instead of flat execution list */
  isPerpetual?: boolean;
  /** Cohort data from useCohortesActivas - required for cohort view */
  cohortesData?: CohortesActivasResponse["data"];
  /** Flow ID - required for cohort prospects drilldown */
  flujoId?: number;
  /** Callback to start the onboarding tour */
  onStartTour?: () => void;
}

interface StageItemProps {
  stage: ExecutionStageItem;
  nodeLabel: string;
  isLast: boolean;
}

interface ExecutionCardProps {
  ejecucion: ExecutionListItem;
  nodeLabelMap: Map<string, string>;
  onViewExecution?: (ejecucionId: number) => void;
  onCostRecalculated?: () => void;
  defaultExpanded?: boolean;
}

interface StageStatistics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  executing: number;
}

// ============================================================================
// Cohort View Types
// ============================================================================

interface CohortCardProps {
  cohorte: CohorteActiva;
  nodeLabelMap: Map<string, string>;
  onViewExecution?: (ejecucionId: number) => void;
  onViewProspectos?: (cohorte: CohorteActiva) => void;
  defaultExpanded?: boolean;
  /** Flow ID - required for etapas history timeline */
  flujoId: number;
  /** Config structure for stage label resolution */
  configStructure?: ConfigStructure;
  /** Whether this is the first card (for tour data attributes) */
  isFirst?: boolean;
}

interface CohortSummaryProps {
  totalCohortes: number;
  totalProspectos: number;
  cohortesActivas: number;
  cohortesCompletadas: number;
  estadisticasEnvios?: {
    total_prospectos: number;
    enviados: number;
    abiertos: number;
    clicks: number;
    tasa_apertura: number;
    tasa_clicks: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Infers the node type icon based on node ID patterns
 */
function getNodeTypeIcon(nodeId: string) {
  if (nodeId.includes("email") || nodeId.includes("mail")) {
    return <Mail className="h-4 w-4" />;
  }
  if (nodeId.includes("sms") || nodeId.includes("message")) {
    return <MessageSquare className="h-4 w-4" />;
  }
  if (nodeId.includes("condition") || nodeId.includes("branch")) {
    return <GitBranch className="h-4 w-4" />;
  }
  return <CheckCircle2 className="h-4 w-4" />;
}

/**
 * Sorts stages by scheduled date
 */
function sortStagesByDate(stages: ExecutionStageItem[]): ExecutionStageItem[] {
  return [...stages].sort((a, b) => {
    const dateA = new Date(a.fecha_programada).getTime();
    const dateB = new Date(b.fecha_programada).getTime();
    return dateA - dateB;
  });
}

/**
 * Calculates statistics from stages array
 */
function calculateStageStatistics(
  stages: ExecutionStageItem[],
): StageStatistics | null {
  if (stages.length === 0) return null;

  return {
    total: stages.length,
    completed: stages.filter((s) => s.estado === "completed").length,
    failed: stages.filter((s) => s.estado === "failed").length,
    pending: stages.filter((s) => s.estado === "pending").length,
    executing: stages.filter((s) => s.estado === "executing").length,
  };
}

/**
 * Formats a cohort entry date for display
 */
function formatCohortDate(fecha: string): string {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "---";

  return date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Gets a descriptive label for the cohort origin
 */
function getOrigenLabel(origen: string): { label: string; color: string } {
  if (origen === "auto_asignar_nuevos") {
    return {
      label: "Sync SYSGAL",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }
  if (origen === "manual") {
    return {
      label: "Manual",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }
  return {
    label: origen,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

// ============================================================================
// Cohort View Components
// ============================================================================

/**
 * Summary header showing aggregate cohort statistics
 */
function CohortSummary({
  totalCohortes,
  totalProspectos,
  cohortesActivas,
  cohortesCompletadas,
  estadisticasEnvios,
}: CohortSummaryProps) {
  const completionRate =
    totalCohortes > 0
      ? Math.round((cohortesCompletadas / totalCohortes) * 100)
      : 0;

  return (
    <div data-tour="cohort-summary" className="space-y-4 mb-6">
      {/* Fila 1: Estadísticas de cohortes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-segal-blue/5 rounded-lg p-3 border border-segal-blue/10">
          <div className="flex items-center gap-2 text-segal-blue mb-1">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-medium">Total Cohortes</span>
          </div>
          <p className="text-2xl font-bold text-segal-dark">{totalCohortes}</p>
        </div>

        <div
          data-tour="stat-total-prospectos"
          className="bg-segal-blue/5 rounded-lg p-3 border border-segal-blue/10"
        >
          <div className="flex items-center gap-2 text-segal-blue mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Total Prospectos</span>
          </div>
          <p className="text-2xl font-bold text-segal-dark">
            {totalProspectos.toLocaleString()}
          </p>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Loader2 className="h-4 w-4" />
            <span className="text-xs font-medium">En Progreso</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{cohortesActivas}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Completados</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {cohortesCompletadas}
            <span className="text-sm font-normal text-green-600 ml-1">
              ({completionRate}%)
            </span>
          </p>
        </div>
      </div>

      {/* Fila 2: Estadísticas de envíos - MÉTRICAS CLAVE PARA GERENCIA */}
      {estadisticasEnvios && estadisticasEnvios.enviados > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-segal-dark mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            Resumen de Envíos del Flujo
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {estadisticasEnvios.enviados.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 font-medium">Enviados</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100 text-center">
              <p className="text-2xl font-bold text-green-700">
                {estadisticasEnvios.abiertos.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 font-medium">
                Abiertos ({estadisticasEnvios.tasa_apertura}%)
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {estadisticasEnvios.clicks.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 font-medium">
                Clicks ({estadisticasEnvios.tasa_clicks}%)
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-700">
                {estadisticasEnvios.total_prospectos.toLocaleString()}
              </p>
              <p className="text-xs text-slate-600 font-medium">Alcanzados</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual cohort card with expandable details
 */
function CohortCard({
  cohorte,
  nodeLabelMap,
  onViewExecution,
  onViewProspectos,
  defaultExpanded = false,
  flujoId,
  configStructure,
  isFirst = false,
}: CohortCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const colorClass = getExecutionStateColor(cohorte.estado);
  const origenInfo = getOrigenLabel(cohorte.origen);

  const handleProspectosClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProspectos?.(cohorte);
  };

  // Calculate progress bar color based on state
  const progressColor =
    cohorte.estado === "completed"
      ? "bg-green-500"
      : cohorte.estado === "failed"
        ? "bg-red-500"
        : "bg-segal-blue";

  return (
    <div
      {...(isFirst ? { "data-tour": "cohort-card" } : {})}
      className="border border-segal-blue/10 rounded-lg overflow-hidden bg-white hover:border-segal-blue/20 transition-colors"
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 flex items-start justify-between gap-4 hover:bg-segal-blue/5 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1">
          {/* Icon and main info */}
          <div className={cn("p-2 rounded-lg border", colorClass)}>
            <Calendar className="h-5 w-5" />
          </div>

          <div className="text-left flex-1">
            {/* Cohort title with date */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-segal-dark">
                Cohorte {formatCohortDate(cohorte.created_at)}
              </p>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full border",
                  origenInfo.color,
                )}
              >
                {origenInfo.label}
              </span>
            </div>

            {/* Key metrics row */}
            <div className="flex items-center gap-4 mt-2 text-sm text-segal-dark/70">
              <button
                type="button"
                onClick={handleProspectosClick}
                className="flex items-center gap-1 hover:text-segal-blue transition-colors group"
                title="Ver prospectos de esta cohorte"
                {...(isFirst ? { "data-tour": "cohort-prospectos-count" } : {})}
              >
                <Users className="h-4 w-4 group-hover:text-segal-blue" />
                <strong className="group-hover:underline">
                  {cohorte.prospectos_count.toLocaleString()}
                </strong>{" "}
                prospectos
              </button>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {cohorte.etapas_completadas}/{cohorte.etapas_total} etapas
              </span>
            </div>

            {/* Progress bar */}
            <div
              {...(isFirst ? { "data-tour": "cohort-progress" } : {})}
              className="mt-3 flex items-center gap-3"
            >
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    progressColor,
                  )}
                  style={{ width: `${cohorte.progreso}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-segal-dark min-w-[3rem] text-right">
                {cohorte.progreso}%
              </span>
            </div>
          </div>
        </div>

        {/* Right side: status and expand button */}
        <div className="flex items-center gap-3">
          <span
            {...(isFirst ? { "data-tour": "cohort-estado" } : {})}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border",
              colorClass,
            )}
          >
            {getExecutionStateIcon(cohorte.estado, "h-3 w-3")}
            <span className="ml-1">{cohorte.estado_legible}</span>
          </span>

          {onViewExecution && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onViewExecution(cohorte.id);
              }}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
              title="Ver monitoreo visual"
              {...(isFirst ? { "data-tour": "cohort-ver-btn" } : {})}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
          )}

          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-segal-dark/40" />
          ) : (
            <ChevronRight className="h-5 w-5 text-segal-dark/40" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-segal-blue/10 p-4 bg-segal-blue/5">
          {/* Current stage info */}
          {cohorte.nodo_actual && (
            <div className="bg-white rounded-lg p-4 border border-segal-blue/10 mb-4">
              <h4 className="text-sm font-semibold text-segal-dark mb-2">
                Estado Actual
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-segal-dark/60 mb-1">
                    Etapa actual
                  </p>
                  <p className="font-medium text-segal-dark">
                    {nodeLabelMap.get(cohorte.nodo_actual) ||
                      cohorte.nodo_actual}
                  </p>
                </div>
                {cohorte.proximo_nodo && (
                  <div>
                    <p className="text-xs text-segal-dark/60 mb-1">
                      Próxima etapa
                    </p>
                    <p className="font-medium text-segal-dark">
                      {nodeLabelMap.get(cohorte.proximo_nodo) ||
                        cohorte.proximo_nodo}
                      {cohorte.fecha_proximo_nodo && (
                        <span className="text-xs text-segal-dark/50 ml-2">
                          ({formatExecutionDate(cohorte.fecha_proximo_nodo)})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Etapas History Timeline - detailed metrics per stage */}
          <EtapasHistoryTimeline
            flujoId={flujoId}
            ejecucionId={cohorte.id}
            configStructure={configStructure}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Empty state for cohort view
 */
function CohortEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
      <Layers className="h-12 w-12 text-segal-blue/40 mb-3" />
      <p className="text-segal-dark/60 font-medium">Sin cohortes registradas</p>
      <p className="text-sm text-segal-dark/40 mt-1">
        Las cohortes aparecerán cuando el flujo reciba prospectos del sync de
        SYSGAL
      </p>
    </div>
  );
}

// ============================================================================
// Sub-Components (Legacy View)
// ============================================================================

function StageItem({ stage, nodeLabel, isLast }: StageItemProps) {
  const colorClass = getExecutionStateColor(stage.estado);

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass}`}
      >
        {getExecutionStateIcon(stage.estado, "h-3 w-3")}
      </div>

      {/* Content */}
      <div className={`pb-4 ${isLast ? "" : "border-b border-gray-100 mb-4"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {getNodeTypeIcon(stage.node_id)}
              <span className="font-medium text-segal-dark">{nodeLabel}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}
              >
                {getExecutionStateLabel(stage.estado)}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-segal-dark/60">
              <div>
                <span className="font-medium">Programada:</span>{" "}
                {formatExecutionDate(stage.fecha_programada)}
              </div>
              {stage.fecha_ejecucion && (
                <div>
                  <span className="font-medium">Ejecutada:</span>{" "}
                  {formatExecutionDate(stage.fecha_ejecucion)}
                </div>
              )}
            </div>

            {stage.error_mensaje && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <span className="font-medium">Error:</span>{" "}
                {stage.error_mensaje}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionCard({
  ejecucion,
  nodeLabelMap,
  onViewExecution,
  onCostRecalculated,
  defaultExpanded = false,
}: ExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const recalcularCosto = useRecalcularCosto();

  const colorClass = getExecutionStateColor(ejecucion.estado);
  const fechaInicio =
    ejecucion.fecha_inicio_real ??
    ejecucion.fecha_inicio_programada ??
    ejecucion.created_at;
  const duracion = calculateExecutionDuration(fechaInicio, ejecucion.fecha_fin);

  const etapasOrdenadas = ejecucion.etapas
    ? sortStagesByDate(ejecucion.etapas)
    : [];

  const estadisticas = calculateStageStatistics(etapasOrdenadas);

  const handleToggleExpand = () => setIsExpanded((prev) => !prev);

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewExecution?.(ejecucion.id);
  };

  const handleRecalcularCosto = (e: React.MouseEvent) => {
    e.stopPropagation();
    recalcularCosto.mutate(ejecucion.id, {
      onSuccess: (data) => {
        toast.success("Costo recalculado correctamente", {
          description: `Nuevo costo: ${formatCurrency(data.costo_total)}`,
        });
        onCostRecalculated?.();
      },
      onError: (error: Error) => {
        toast.error("Error al recalcular el costo", {
          description: error.message,
        });
      },
    });
  };

  // Show recalculate button only for completed executions
  const canRecalculate = ejecucion.estado === "completed";

  return (
    <div className="border border-segal-blue/10 rounded-lg overflow-hidden bg-white hover:border-segal-blue/20 transition-colors">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={handleToggleExpand}
        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-segal-blue/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            {getExecutionStateIcon(ejecucion.estado)}
          </div>
          <div className="text-left">
            <p className="font-semibold text-segal-dark">
              Ejecucion #{ejecucion.id}
            </p>
            <p className="text-sm text-segal-dark/60">
              {formatExecutionDate(fechaInicio)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini stats */}
          {estadisticas && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-green-600" title="Completadas">
                {estadisticas.completed}/{estadisticas.total}
              </span>
              {estadisticas.failed > 0 && (
                <span className="text-red-600" title="Fallidas">
                  {estadisticas.failed} fallidas
                </span>
              )}
            </div>
          )}

          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}
          >
            {getExecutionStateLabel(ejecucion.estado)}
          </span>

          {onViewExecution && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewClick}
              className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
              title="Ver monitoreo visual"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
          )}

          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-segal-dark/40" />
          ) : (
            <ChevronRight className="h-5 w-5 text-segal-dark/40" />
          )}
        </div>
      </button>

      {/* Expanded content - Stages */}
      {isExpanded && (
        <ExpandedContent
          duracion={duracion}
          prospectosCount={
            ejecucion.prospectos_count ?? ejecucion.prospectos_ids?.length
          }
          etapasOrdenadas={etapasOrdenadas}
          nodeLabelMap={nodeLabelMap}
          costoReal={ejecucion.costo_real}
          costoEstimado={ejecucion.costo_estimado}
          totalEmailsEnviados={ejecucion.total_emails_enviados}
          totalSmsEnviados={ejecucion.total_sms_enviados}
          canRecalculate={canRecalculate}
          isRecalculating={recalcularCosto.isPending}
          onRecalculate={handleRecalcularCosto}
        />
      )}
    </div>
  );
}

interface ExpandedContentProps {
  duracion: string;
  prospectosCount?: number;
  etapasOrdenadas: ExecutionStageItem[];
  nodeLabelMap: Map<string, string>;
  costoReal?: number | null;
  costoEstimado?: number | null;
  totalEmailsEnviados?: number | null;
  totalSmsEnviados?: number | null;
  canRecalculate?: boolean;
  isRecalculating?: boolean;
  onRecalculate?: (e: React.MouseEvent) => void;
}

function ExpandedContent({
  duracion,
  prospectosCount,
  etapasOrdenadas,
  nodeLabelMap,
  costoReal,
  costoEstimado,
  totalEmailsEnviados,
  // totalSmsEnviados - available for future use
  canRecalculate,
  isRecalculating,
  onRecalculate,
}: ExpandedContentProps) {
  const costo = costoReal ?? costoEstimado;
  const isEstimado = costoReal === null && costoEstimado !== null;

  return (
    <div className="border-t border-segal-blue/10 p-4 bg-segal-blue/5">
      {/* General info */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 text-sm text-segal-dark/70">
          <span>
            <span className="font-medium">Duracion:</span> {duracion}
          </span>
          {prospectosCount !== undefined && (
            <span>
              <span className="font-medium">Prospectos:</span>{" "}
              {prospectosCount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Cost info with recalculate button */}
        {costo !== null && costo !== undefined && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-segal-blue/10">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span
                className={`font-semibold ${isEstimado ? "text-emerald-600/70" : "text-emerald-700"}`}
              >
                {formatCurrency(costo)}
              </span>
              {isEstimado && (
                <span className="text-xs text-segal-dark/50">(estimado)</span>
              )}
              {!isEstimado &&
                totalEmailsEnviados !== null &&
                totalEmailsEnviados !== undefined &&
                totalEmailsEnviados > 0 && (
                  <span className="text-xs text-segal-dark/50">
                    ({totalEmailsEnviados.toLocaleString()} emails)
                  </span>
                )}
            </div>

            {canRecalculate && onRecalculate && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRecalculate}
                disabled={isRecalculating}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                title="Recalcular costo basado en los envíos reales"
              >
                {isRecalculating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="ml-1.5 hidden sm:inline">Recalcular</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stages timeline */}
      {etapasOrdenadas.length > 0 ? (
        <div className="bg-white rounded-lg p-4 border border-segal-blue/10">
          <p className="text-sm font-semibold text-segal-dark mb-4">
            Historial de Etapas ({etapasOrdenadas.length})
          </p>
          <div>
            {etapasOrdenadas.map((stage, index) => (
              <StageItem
                key={stage.id}
                stage={stage}
                nodeLabel={nodeLabelMap.get(stage.node_id) ?? stage.node_id}
                isLast={index === etapasOrdenadas.length - 1}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-segal-blue/10 text-center text-sm text-segal-dark/50">
          No hay etapas registradas para esta ejecucion
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading & Empty States
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
      <Loader2 className="h-12 w-12 text-segal-blue/40 mb-3 animate-spin" />
      <p className="text-segal-dark/60 font-medium">Cargando ejecuciones...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
      <Clock className="h-12 w-12 text-segal-blue/40 mb-3" />
      <p className="text-segal-dark/60 font-medium">
        No hay ejecuciones registradas
      </p>
      <p className="text-sm text-segal-dark/40 mt-1">
        Este flujo aun no ha sido ejecutado
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExecutionHistoryPanel({
  ejecuciones,
  isLoading,
  onViewExecution,
  onRefresh,
  configVisual,
  configStructure,
  isPerpetual = false,
  cohortesData,
  flujoId,
  onStartTour,
}: ExecutionHistoryPanelProps) {
  const nodeLabelMap = useNodeLabelMap(configVisual);
  
  // Drawer state for cohort prospects drilldown
  const [selectedCohorte, setSelectedCohorte] = useState<CohorteActiva | null>(null);
  const isDrawerOpen = selectedCohorte !== null;

  const handleViewProspectos = (cohorte: CohorteActiva) => {
    setSelectedCohorte(cohorte);
  };

  const handleCloseDrawer = () => {
    setSelectedCohorte(null);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  // =========================================================================
  // COHORT VIEW (for perpetual flows)
  // =========================================================================
  if (isPerpetual && cohortesData) {
    const { cohortes, total_cohortes } = cohortesData;

    // Calculate aggregate stats
    const totalProspectos = cohortes.reduce(
      (acc, c) => acc + c.prospectos_count,
      0,
    );
    const cohortesActivas = cohortes.filter(
      (c) => c.estado === "in_progress" || c.estado === "paused" || c.estado === "waiting",
    ).length;
    const cohortesCompletadas = cohortes.filter(
      (c) => c.estado === "completed",
    ).length;

    if (total_cohortes === 0 || cohortes.length === 0) {
      return <CohortEmptyState />;
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-segal-blue" />
            <h3 className="text-lg font-bold text-segal-dark">
              Cohortes del Flujo
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-segal-dark/60 bg-segal-blue/10 px-2 py-1 rounded-full">
              Flujo Perpetuo
            </span>
            {onStartTour && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onStartTour}
                className="text-segal-blue hover:bg-segal-blue/10"
                title="Iniciar tour guiado"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Cohort Summary Stats */}
        <CohortSummary
          totalCohortes={total_cohortes}
          totalProspectos={totalProspectos}
          cohortesActivas={cohortesActivas}
          cohortesCompletadas={cohortesCompletadas}
          estadisticasEnvios={cohortesData.estadisticas_envios}
        />

        {/* Cohort Cards */}
        <div className="space-y-3">
          {cohortes.map((cohorte, index) => (
            <CohortCard
              key={cohorte.id}
              cohorte={cohorte}
              nodeLabelMap={nodeLabelMap}
              onViewExecution={onViewExecution}
              onViewProspectos={handleViewProspectos}
              defaultExpanded={index === 0}
              flujoId={flujoId!}
              configStructure={configStructure}
              isFirst={index === 0}
            />
          ))}
        </div>

        {/* Cohort Prospects Drawer */}
        {flujoId && selectedCohorte && (
          <CohortProspectDrawer
            isOpen={isDrawerOpen}
            onClose={handleCloseDrawer}
            flujoId={flujoId}
            ejecucionId={selectedCohorte.id}
            cohorteInfo={{
              id: selectedCohorte.id,
              fecha: selectedCohorte.created_at,
              prospectos_count: selectedCohorte.prospectos_count,
              estado: selectedCohorte.estado,
            }}
            configVisual={configVisual}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // LEGACY VIEW (for non-perpetual flows)
  // =========================================================================
  if (!ejecuciones || ejecuciones.length === 0) {
    return <EmptyState />;
  }

  const ejecutionCount = ejecuciones.length;
  const pluralSuffix = ejecutionCount !== 1 ? "es" : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-segal-dark">
          Historial de Ejecuciones
        </h3>
        <span className="text-sm text-segal-dark/60">
          {ejecutionCount} ejecucion{pluralSuffix}
        </span>
      </div>

      <div className="space-y-3">
        {ejecuciones.map((ejecucion, index) => (
          <ExecutionCard
            key={ejecucion.id}
            ejecucion={ejecucion}
            nodeLabelMap={nodeLabelMap}
            onViewExecution={onViewExecution}
            onCostRecalculated={onRefresh}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
