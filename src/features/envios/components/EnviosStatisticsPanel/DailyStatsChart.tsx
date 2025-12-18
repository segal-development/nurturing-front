/**
 * Daily Statistics Chart
 * Shows daily envios with email/SMS breakdown
 */

import type { EnviosDailyStatsResponse } from '@/types/envios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DailyStatsChartProps {
  data?: EnviosDailyStatsResponse
}

export function DailyStatsChart({ data }: DailyStatsChartProps) {
  if (!data || data.estadisticas.length === 0) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Estadísticas Diarias</CardTitle>
          <CardDescription className="dark:text-white/60">
            Envíos por día para el período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-segal-dark/60 dark:text-white/60">
            No hay datos para mostrar en este período
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate max value for scaling (currently not used but kept for future enhancements)
  // const maxValue = Math.max(...data.estadisticas.map((e) => e.total), 1)

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="dark:text-white">Estadísticas Diarias</CardTitle>
        <CardDescription className="dark:text-white/60">
          Envíos por día para el período {data.periodo.fecha_inicio} a {data.periodo.fecha_fin}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart using divs */}
        <div className="space-y-4">
          {data.estadisticas.map((stat) => {
            const emailPercent = (stat.email_count / stat.total) * 100
            const smsPercent = (stat.sms_count / stat.total) * 100

            return (
              <div key={stat.fecha} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-segal-dark dark:text-white">
                    {new Date(stat.fecha).toLocaleDateString('es-CL', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-segal-dark/70 dark:text-white/70">
                    {stat.total} envíos ({stat.exitosos} ✓, {stat.fallidos} ✗)
                  </span>
                </div>

                {/* Stacked bar */}
                <div className="flex h-6 rounded overflow-hidden bg-segal-blue/5 dark:bg-slate-800">
                  <div
                    className="bg-segal-blue dark:bg-segal-turquoise transition-all"
                    style={{ width: `${emailPercent}%` }}
                    title={`Email: ${stat.email_count}`}
                  />
                  <div
                    className="bg-segal-green dark:bg-emerald-500 transition-all"
                    style={{ width: `${smsPercent}%` }}
                    title={`SMS: ${stat.sms_count}`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-segal-blue/10 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-segal-blue dark:bg-segal-turquoise" />
            <span className="text-sm text-segal-dark/70 dark:text-white/70">📧 Email</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-segal-green dark:bg-emerald-500" />
            <span className="text-sm text-segal-dark/70 dark:text-white/70">📱 SMS</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DailyStatsChart
