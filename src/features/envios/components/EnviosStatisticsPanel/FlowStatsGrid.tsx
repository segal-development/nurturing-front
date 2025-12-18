/**
 * Flow Statistics Grid
 * Shows statistics for each flow
 */

import type { EnviosFlowStatsResponse } from '@/types/envios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Users } from 'lucide-react'

interface FlowStatsGridProps {
  data?: EnviosFlowStatsResponse
}

export function FlowStatsGrid({ data }: FlowStatsGridProps) {
  if (!data || data.estadisticas.length === 0) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Estadísticas por Flujo</CardTitle>
          <CardDescription className="dark:text-white/60">
            Desempeño de cada flujo en el período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-segal-dark/60 dark:text-white/60">
            No hay flujos con envíos en este período
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-segal-dark dark:text-white mb-4">
          Estadísticas por Flujo
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.estadisticas.map((flowStat) => {
          const successRate = flowStat.total > 0 ? (flowStat.exitosos / flowStat.total) * 100 : 0

          return (
            <Card key={flowStat.flujo_id} className="dark:bg-slate-900 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base dark:text-white">
                  {flowStat.flujo_nombre}
                </CardTitle>
                <CardDescription className="dark:text-white/60">
                  Flujo #{flowStat.flujo_id}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Main metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-2xl font-bold text-segal-dark dark:text-white">
                      {flowStat.total}
                    </p>
                    <p className="text-xs text-segal-dark/60 dark:text-white/60 mt-1">
                      <Users className="h-3 w-3 inline mr-1" />
                      Total
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {flowStat.exitosos}
                    </p>
                    <p className="text-xs text-green-600/60 dark:text-green-400/60 mt-1">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                      Exitosos
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {flowStat.fallidos}
                    </p>
                    <p className="text-xs text-red-600/60 dark:text-red-400/60 mt-1">
                      <XCircle className="h-3 w-3 inline mr-1" />
                      Fallidos
                    </p>
                  </div>
                </div>

                {/* Success rate bar */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium text-segal-dark dark:text-white">
                      Tasa de Éxito
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        successRate >= 90
                          ? 'text-green-600 dark:text-green-400'
                          : successRate >= 70
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        successRate >= 90
                          ? 'bg-green-600 dark:bg-green-500'
                          : successRate >= 70
                            ? 'bg-yellow-600 dark:bg-yellow-500'
                            : 'bg-red-600 dark:bg-red-500'
                      }`}
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>

                {/* Channel breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-segal-blue/10 dark:border-slate-700">
                  <div className="text-sm">
                    <p className="text-segal-dark/70 dark:text-white/70">📧 Email</p>
                    <p className="text-lg font-semibold text-segal-dark dark:text-white">
                      {flowStat.email_count}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-segal-dark/70 dark:text-white/70">📱 SMS</p>
                    <p className="text-lg font-semibold text-segal-dark dark:text-white">
                      {flowStat.sms_count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Overall summary */}
      {data && (
        <Card className="bg-segal-blue/5 border-segal-blue/10 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-segal-dark/60 dark:text-white/60">Total Flujos</p>
                <p className="text-2xl font-bold text-segal-dark dark:text-white">
                  {data.resumen.total_flujos}
                </p>
              </div>
              <div>
                <p className="text-sm text-segal-dark/60 dark:text-white/60">Total Envíos</p>
                <p className="text-2xl font-bold text-segal-dark dark:text-white">
                  {data.resumen.total_envios}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600/60 dark:text-green-400/60">Exitosos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.resumen.total_exitosos}
                </p>
              </div>
              <div>
                <p className="text-sm text-red-600/60 dark:text-red-400/60">Fallidos</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {data.resumen.total_fallidos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FlowStatsGrid
