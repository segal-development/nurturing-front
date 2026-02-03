/**
 * Costs Dashboard Page
 * Shows cost statistics, trends, and breakdowns for nurturing campaigns
 */

import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { useCostoDashboard } from '@/features/costos/hooks'
import { AlertCircle, Loader2 } from 'lucide-react'
import { CostosDateFilter } from '@/features/costos/components/CostosDateFilter'
import { CostosSummaryCards } from '@/features/costos/components/CostosSummaryCards'
import { CostosPorDiaTable } from '@/features/costos/components/CostosPorDiaTable'
import { CostosPorFlujoTable } from '@/features/costos/components/CostosPorFlujoTable'

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-segal-dark dark:text-white">Dashboard de Costos</h1>
        <p className="text-sm text-segal-dark/60 dark:text-gray-400">
          Monitorea los gastos de tus campañas de nurturing
        </p>
      </div>

      {/* Date Filters */}
      <CostosDateFilter
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onRefetch={() => refetch()}
        isLoading={isLoading}
      />

      {/* Error state */}
      {isError && (
        <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Error al cargar datos</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error?.message || 'Intenta de nuevo más tarde'}</p>
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
          <CostosSummaryCards
            resumen={dashboardData.resumen}
            preciosActuales={dashboardData.precios_actuales}
            comparacionEstimadoReal={dashboardData.comparacion_estimado_real}
          />

          {/* Two-column layout for tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostosPorDiaTable data={dashboardData.costos_por_dia} />
            <CostosPorFlujoTable data={dashboardData.costos_por_flujo} />
          </div>

          {/* Pricing Info */}
          <Card className="border-segal-blue/10 dark:border-gray-700 bg-segal-blue/5 dark:bg-gray-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-segal-dark/70 dark:text-gray-400">Precios actuales:</span>
                  <span className="font-medium text-blue-700 dark:text-blue-400">
                    📧 Email: ${dashboardData.precios_actuales.email}
                  </span>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    📱 SMS: ${dashboardData.precios_actuales.sms}
                  </span>
                </div>
                <span className="text-xs text-segal-dark/50 dark:text-gray-500">
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
