/**
 * Summary Statistics
 * Overall statistics for the period
 */

import type { EnviosDailyStatsResponse, EnviosFlowStatsResponse } from '@/types/envios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, CheckCircle2, XCircle, Mail, MessageSquare } from 'lucide-react'

interface SummaryStatsProps {
  dailyData?: EnviosDailyStatsResponse
  flowData?: EnviosFlowStatsResponse
}

export function SummaryStats({ dailyData, flowData }: SummaryStatsProps) {
  if (!dailyData) return null

  const resumen = dailyData.resumen

  const successRate =
    resumen.total > 0 ? ((resumen.exitosos / resumen.total) * 100).toFixed(1) : '0'
  const failureRate =
    resumen.total > 0 ? ((resumen.fallidos / resumen.total) * 100).toFixed(1) : '0'

  const totalEmail = dailyData.estadisticas.reduce((sum, s) => sum + s.email_count, 0)
  const totalSms = dailyData.estadisticas.reduce((sum, s) => sum + s.sms_count, 0)

  const statCards = [
    {
      title: 'Total Enviados',
      value: resumen.total,
      icon: Users,
      color: 'bg-segal-blue dark:bg-segal-turquoise',
      textColor: 'text-segal-blue dark:text-segal-turquoise',
      bgColor: 'bg-segal-blue/5 dark:bg-slate-800',
    },
    {
      title: 'Exitosos',
      value: resumen.exitosos,
      subtitle: `${successRate}%`,
      icon: CheckCircle2,
      color: 'bg-green-600 dark:bg-green-500',
      textColor: 'text-green-600 dark:text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Fallidos',
      value: resumen.fallidos,
      subtitle: `${failureRate}%`,
      icon: XCircle,
      color: 'bg-red-600 dark:bg-red-500',
      textColor: 'text-red-600 dark:text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      title: 'Promedio Diario',
      value: dailyData.estadisticas.length > 0 ? (resumen.total / dailyData.estadisticas.length).toFixed(0) : 0,
      icon: TrendingUp,
      color: 'bg-segal-green dark:bg-emerald-500',
      textColor: 'text-segal-green dark:text-emerald-500',
      bgColor: 'bg-segal-green/5 dark:bg-slate-800',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={`${stat.bgColor} dark:border-slate-700 border-none`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium dark:text-white/70">
                  {stat.title}
                  <Icon className={`h-4 w-4 ${stat.textColor}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-segal-dark/60 dark:text-white/50">{stat.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Channel Comparison */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Comparativa de Canales</CardTitle>
          <CardDescription className="dark:text-white/60">
            Distribución de envíos por canal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
                <div>
                  <p className="font-medium text-segal-dark dark:text-white">Email</p>
                  <p className="text-2xl font-bold text-segal-blue dark:text-segal-turquoise">
                    {totalEmail}
                  </p>
                </div>
              </div>
              <div className="text-sm text-segal-dark/60 dark:text-white/60">
                {totalEmail > 0 ? ((totalEmail / resumen.total) * 100).toFixed(1) : 0}% del total
              </div>
              <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-segal-blue dark:bg-segal-turquoise h-full rounded-full"
                  style={{
                    width: `${totalEmail > 0 ? ((totalEmail / resumen.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* SMS */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-segal-green dark:text-emerald-400" />
                <div>
                  <p className="font-medium text-segal-dark dark:text-white">SMS</p>
                  <p className="text-2xl font-bold text-segal-green dark:text-emerald-400">
                    {totalSms}
                  </p>
                </div>
              </div>
              <div className="text-sm text-segal-dark/60 dark:text-white/60">
                {totalSms > 0 ? ((totalSms / resumen.total) * 100).toFixed(1) : 0}% del total
              </div>
              <div className="w-full bg-segal-green/10 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-segal-green dark:bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${totalSms > 0 ? ((totalSms / resumen.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Summary */}
      {flowData && (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Resumen por Flujo</CardTitle>
            <CardDescription className="dark:text-white/60">
              {flowData.estadisticas.length} flujos activos en el período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flowData.estadisticas.slice(0, 5).map((flow) => {
                const rate =
                  flow.total > 0 ? ((flow.exitosos / flow.total) * 100).toFixed(0) : '0'

                return (
                  <div key={flow.flujo_id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-segal-dark dark:text-white text-sm">
                        {flow.flujo_nombre}
                      </p>
                      <p className="text-xs text-segal-dark/60 dark:text-white/60">
                        {flow.total} envíos ({flow.exitosos} exitosos)
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm ${
                          parseInt(rate) >= 90
                            ? 'text-green-600 dark:text-green-400'
                            : parseInt(rate) >= 70
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {rate}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SummaryStats
