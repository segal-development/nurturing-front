/**
 * Envios Statistics Panel
 *
 * Displays comprehensive statistics about shipments with:
 * - Daily statistics chart
 * - Email vs SMS breakdown
 * - Statistics grouped by flow
 * - Date range selector with presets
 * - Summary statistics cards
 */

import { useState } from 'react'
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns'
import { AlertCircle, BarChart3, Loader2, PieChart as PieChartIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEnviosDailyStats, useEnviosFlowStats } from '@/features/envios/hooks'
import DailyStatsChart from './DailyStatsChart'
import ChannelBreakdown from './ChannelBreakdown'
import FlowStatsGrid from './FlowStatsGrid'
import SummaryStats from './SummaryStats'

/**
 * Main statistics panel component
 *
 * @example
 * <EnviosStatisticsPanel />
 */
export function EnviosStatisticsPanel() {
  // State for date range
  const today = new Date()
  const defaultStartDate = startOfMonth(today)
  const defaultEndDate = endOfMonth(today)

  const [startDate, setStartDate] = useState<Date>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date>(defaultEndDate)

  // Fetch statistics
  const dailyStatsQuery = useEnviosDailyStats(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
  )

  const flowStatsQuery = useEnviosFlowStats(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
  )

  // Handle preset date ranges
  const handlePresetDateRange = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)
    setStartDate(start)
    setEndDate(end)
  }

  const handleThisMonth = () => {
    setStartDate(startOfMonth(today))
    setEndDate(endOfMonth(today))
  }

  const handleLastMonth = () => {
    const lastMonth = subDays(today, 30)
    setStartDate(startOfMonth(lastMonth))
    setEndDate(endOfMonth(lastMonth))
  }

  // Calculate loading and error states
  const isLoading = dailyStatsQuery.isLoading || flowStatsQuery.isLoading
  const isError = dailyStatsQuery.isError || flowStatsQuery.isError
  const error = dailyStatsQuery.error || flowStatsQuery.error

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-segal-dark dark:text-white">
          Estadísticas de Envíos
        </h1>
        <p className="text-segal-dark/60 dark:text-white/60 mt-2">
          Monitorea el desempeño de tus campañas de email y SMS
        </p>
      </div>

      {/* Date Range Selector */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Período a Analizar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Fecha Inicio
              </span>
              <DatePicker
                date={startDate}
                onDateChange={(date) => date && setStartDate(date)}
                placeholder="Seleccionar fecha"
                toDate={endDate}
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Fecha Fin
              </span>
              <DatePicker
                date={endDate}
                onDateChange={(date) => date && setEndDate(date)}
                placeholder="Seleccionar fecha"
                fromDate={startDate}
                toDate={new Date()}
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetDateRange(7)}
              className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              Esta Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleThisMonth}
              className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              Este Mes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastMonth}
              className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              Mes Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetDateRange(90)}
              className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              Últimos 3 Meses
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                Error al cargar estadísticas
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {error?.message || 'Intenta de nuevo más tarde'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dailyStatsQuery.refetch()
                flowStatsQuery.refetch()
              }}
              className="ml-auto dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise" />
              <p className="text-segal-dark/60 dark:text-white/60">
                Cargando estadísticas...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      {!isLoading && !isError && (
        <Tabs defaultValue="diario" className="space-y-4">
          <TabsList className="dark:bg-slate-800 dark:border-slate-700">
            <TabsTrigger
              value="diario"
              className="dark:text-white dark:data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Diario
            </TabsTrigger>
            <TabsTrigger
              value="por-flujo"
              className="dark:text-white dark:data-[state=active]:text-white"
            >
              <PieChartIcon className="h-4 w-4 mr-2" />
              Por Flujo
            </TabsTrigger>
            <TabsTrigger
              value="resumen"
              className="dark:text-white dark:data-[state=active]:text-white"
            >
              Resumen
            </TabsTrigger>
          </TabsList>

          {/* Daily Tab */}
          <TabsContent value="diario" className="space-y-4">
            <DailyStatsChart data={dailyStatsQuery.data} />
            <ChannelBreakdown data={dailyStatsQuery.data} />
          </TabsContent>

          {/* Flow Stats Tab */}
          <TabsContent value="por-flujo">
            <FlowStatsGrid data={flowStatsQuery.data} />
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="resumen">
            <SummaryStats
              dailyData={dailyStatsQuery.data}
              flowData={flowStatsQuery.data}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default EnviosStatisticsPanel
