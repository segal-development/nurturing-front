/**
 * Panel de estadísticas para mostrar el estado general de un flujo
 * Muestra información sobre prospectos, etapas, ramificaciones, etc.
 */

import { BarChart3, Users, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { EstadisticasFlujo } from '@/types/flujo'

interface FlujoStatisticsPanelProps {
  estadisticas: EstadisticasFlujo | undefined
}

export function FlujoStatisticsPanel({ estadisticas }: FlujoStatisticsPanelProps) {
  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center p-8 bg-segal-blue/5 rounded-lg border border-segal-blue/10">
        <p className="text-segal-dark/60">No hay estadísticas disponibles</p>
      </div>
    )
  }

  // Calcular porcentaje de completitud
  const porcentajeCompletitud =
    estadisticas.total_prospectos > 0
      ? Math.round((estadisticas.prospectos_completados / estadisticas.total_prospectos) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Estadísticas de Prospectos */}
      <div>
        <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-segal-blue" />
          Estado de Prospectos
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Prospectos */}
          <div className="bg-gradient-to-br from-segal-blue/10 to-segal-blue/5 rounded-lg p-4 border border-segal-blue/20">
            <p className="text-xs font-semibold text-segal-dark/60 mb-2">Total de Prospectos</p>
            <p className="text-3xl font-bold text-segal-blue">{estadisticas.total_prospectos}</p>
          </div>

          {/* Pendientes */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-5 rounded-lg p-4 border border-yellow-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-xs font-semibold text-yellow-700">Pendientes</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{estadisticas.prospectos_pendientes}</p>
            <p className="text-xs text-yellow-600/60 mt-1">
              {Math.round((estadisticas.prospectos_pendientes / estadisticas.total_prospectos) * 100)}%
            </p>
          </div>

          {/* En Proceso */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-5 rounded-lg p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">En Proceso</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{estadisticas.prospectos_en_proceso}</p>
            <p className="text-xs text-blue-600/60 mt-1">
              {Math.round((estadisticas.prospectos_en_proceso / estadisticas.total_prospectos) * 100)}%
            </p>
          </div>

          {/* Completados */}
          <div className="bg-gradient-to-br from-segal-green/10 to-segal-green/5 rounded-lg p-4 border border-segal-green/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-segal-green" />
              <p className="text-xs font-semibold text-segal-green/80">Completados</p>
            </div>
            <p className="text-3xl font-bold text-segal-green">{estadisticas.prospectos_completados}</p>
            <p className="text-xs text-segal-green/60 mt-1">{porcentajeCompletitud}%</p>
          </div>
        </div>
      </div>

      {/* Barra de Progreso General */}
      <div className="bg-white border border-segal-blue/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-segal-dark">Progreso General del Flujo</p>
          <span className="text-lg font-bold text-segal-blue">{porcentajeCompletitud}%</span>
        </div>
        <div className="w-full bg-segal-blue/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-segal-blue to-segal-blue/80 h-full transition-all duration-500"
            style={{ width: `${porcentajeCompletitud}%` }}
          />
        </div>
      </div>

      {/* Estructura del Flujo */}
      <div>
        <h3 className="text-lg font-bold text-segal-dark mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-segal-blue" />
          Estructura del Flujo
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Etapas */}
          <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
            <p className="text-xs font-semibold text-segal-dark/60 mb-2">Total Etapas</p>
            <p className="text-3xl font-bold text-segal-dark">{estadisticas.total_etapas}</p>
          </div>

          {/* Condiciones */}
          <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
            <p className="text-xs font-semibold text-segal-dark/60 mb-2">Condiciones</p>
            <p className="text-3xl font-bold text-segal-dark">{estadisticas.total_condiciones}</p>
          </div>

          {/* Ramificaciones */}
          <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
            <p className="text-xs font-semibold text-segal-dark/60 mb-2">Ramificaciones</p>
            <p className="text-3xl font-bold text-segal-dark">{estadisticas.total_ramificaciones}</p>
          </div>

          {/* Nodos Finales */}
          <div className="bg-segal-blue/5 rounded-lg p-4 border border-segal-blue/10">
            <p className="text-xs font-semibold text-segal-dark/60 mb-2">Nodos Finales</p>
            <p className="text-3xl font-bold text-segal-dark">{estadisticas.total_nodos_finales}</p>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      {estadisticas.prospectos_cancelados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Prospectos Cancelados</p>
              <p className="text-sm text-red-700 mt-1">
                {estadisticas.prospectos_cancelados} prospecto(s) ha(n) sido cancelado(s) en este flujo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
