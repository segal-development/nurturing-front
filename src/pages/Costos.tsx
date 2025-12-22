/**
 * Costs Dashboard Page
 * Shows cost statistics, trends, and breakdowns for nurturing campaigns
 */

import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency, useCostoDashboard } from '@/features/costos/hooks'
import {
  AlertCircle,
  BarChart3,
  Calendar,
  DollarSign,
  Loader2,
  Mail,
  RefreshCw,
  Smartphone,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

/**
 * Main Costos Dashboard Page
 */
export default function Costos() {
  // Date range state - using Date objects now
  const [fechaInicio, setFechaInicio] = useState<Date>(() => startOfMonth(new Date()))
  const [fechaFin, setFechaFin] = useState<Date>(() => new Date())

  // Format dates for API (yyyy-MM-dd)
  const fechaInicioStr = format(fechaInicio, 'yyyy-MM-dd')
  const fechaFinStr = format(fechaFin, 'yyyy-MM-dd')

  // Fetch dashboard data
  const { data: dashboardData, isLoading, isError, error, refetch } = useCostoDashboard(
    fechaInicioStr,
    fechaFinStr
  )

  // Quick date filters
  const setDateRange = (range: 'week' | 'month' | 'quarter') => {
    const end = new Date()
    const start = new Date()

    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setDate(1)
        break
      case 'quarter':
        start.setMonth(end.getMonth() - 3)
        break
    }

    setFechaInicio(start)
    setFechaFin(end)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-segal-dark">Dashboard de Costos</h1>
        <p className="text-sm text-segal-dark/60">
          Monitorea los gastos de tus campañas de nurturing
        </p>
      </div>

      {/* Date Filters */}
      <Card className="border-segal-blue/10">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-segal-blue" />
              <span className="text-sm font-medium text-segal-dark">Período:</span>
            </div>

            {/* Quick filters */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange('week')}
                className="text-xs"
              >
                Última semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange('month')}
                className="text-xs"
              >
                Este mes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange('quarter')}
                className="text-xs"
              >
                Último trimestre
              </Button>
            </div>

            {/* Custom date inputs */}
            <div className="flex items-center gap-2">
              <DatePicker
                date={fechaInicio}
                onDateChange={(date) => date && setFechaInicio(date)}
                placeholder="Fecha inicio"
                toDate={fechaFin}
                dateFormat="dd/MM/yyyy"
              />
              <span className="text-segal-dark/40">→</span>
              <DatePicker
                date={fechaFin}
                onDateChange={(date) => date && setFechaFin(date)}
                placeholder="Fecha fin"
                fromDate={fechaInicio}
                toDate={new Date()}
                dateFormat="dd/MM/yyyy"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error al cargar datos</p>
              <p className="text-sm text-red-600">{error?.message || 'Intenta de nuevo más tarde'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
        </div>
      )}

      {/* Dashboard content */}
      {dashboardData && !isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Cost */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-emerald-700">
                  <DollarSign className="h-4 w-4" />
                  Costo Total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-800">
                  {formatCurrency(dashboardData.resumen.costo_total)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {dashboardData.resumen.total_ejecuciones} ejecuciones
                </p>
              </CardContent>
            </Card>

            {/* Email Cost */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-blue-700">
                  <Mail className="h-4 w-4" />
                  Costo Emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-800">
                  {formatCurrency(dashboardData.resumen.costo_emails)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {dashboardData.resumen.total_emails?.toLocaleString()} enviados • ${dashboardData.precios_actuales.email}/email
                </p>
              </CardContent>
            </Card>

            {/* SMS Cost */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-green-700">
                  <Smartphone className="h-4 w-4" />
                  Costo SMS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-800">
                  {formatCurrency(dashboardData.resumen.costo_sms)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {dashboardData.resumen.total_sms?.toLocaleString()} enviados • ${dashboardData.precios_actuales.sms}/SMS
                </p>
              </CardContent>
            </Card>

            {/* Estimated vs Real */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-purple-700">
                  <BarChart3 className="h-4 w-4" />
                  Estimado vs Real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {dashboardData.comparacion_estimado_real.diferencia_porcentaje > 0 ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : dashboardData.comparacion_estimado_real.diferencia_porcentaje < 0 ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : null}
                  <p className={`text-3xl font-bold ${
                    dashboardData.comparacion_estimado_real.diferencia_porcentaje > 0
                      ? 'text-red-600'
                      : dashboardData.comparacion_estimado_real.diferencia_porcentaje < 0
                        ? 'text-green-600'
                        : 'text-purple-800'
                  }`}>
                    {dashboardData.comparacion_estimado_real.diferencia_porcentaje > 0 ? '+' : ''}
                    {dashboardData.comparacion_estimado_real.diferencia_porcentaje}%
                  </p>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Est: {formatCurrency(dashboardData.comparacion_estimado_real.total_estimado)} →
                  Real: {formatCurrency(dashboardData.comparacion_estimado_real.total_real)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two-column layout for tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Costs by Day */}
            <Card className="border-segal-blue/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-segal-blue" />
                  Costos por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.costos_por_dia.length === 0 ? (
                  <p className="text-sm text-segal-dark/60 text-center py-8">
                    No hay datos para el período seleccionado
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {dashboardData.costos_por_dia.map((dia) => (
                      <div
                        key={dia.fecha}
                        className="flex items-center justify-between p-3 rounded-lg bg-segal-blue/5 hover:bg-segal-blue/10 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-segal-dark">
                            {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-CL', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xs text-segal-dark/60">
                            {dia.ejecuciones} ejecución{dia.ejecuciones !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-700">
                            {formatCurrency(dia.costo_total)}
                          </p>
                          <p className="text-xs text-segal-dark/60">
                            📧 {formatCurrency(dia.costo_emails)} • 📱 {formatCurrency(dia.costo_sms)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Costs by Flow */}
            <Card className="border-segal-blue/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-segal-blue" />
                  Costos por Flujo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.costos_por_flujo.length === 0 ? (
                  <p className="text-sm text-segal-dark/60 text-center py-8">
                    No hay datos para el período seleccionado
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {dashboardData.costos_por_flujo.map((flujo) => (
                      <div
                        key={flujo.flujo_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-segal-blue/5 hover:bg-segal-blue/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-segal-dark truncate">
                            {flujo.flujo_nombre}
                          </p>
                          <p className="text-xs text-segal-dark/60">
                            {flujo.ejecuciones} ejecución{flujo.ejecuciones !== 1 ? 'es' : ''} •
                            📧 {flujo.total_emails} • 📱 {flujo.total_sms}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-emerald-700">
                            {formatCurrency(flujo.costo_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Info */}
          <Card className="border-segal-blue/10 bg-segal-blue/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-segal-dark/70">Precios actuales:</span>
                  <span className="font-medium text-blue-700">
                    📧 Email: ${dashboardData.precios_actuales.email}
                  </span>
                  <span className="font-medium text-green-700">
                    📱 SMS: ${dashboardData.precios_actuales.sms}
                  </span>
                </div>
                <span className="text-xs text-segal-dark/50">
                  Período: {new Date(dashboardData.periodo.fecha_inicio).toLocaleDateString('es-CL')} - {new Date(dashboardData.periodo.fecha_fin).toLocaleDateString('es-CL')}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
