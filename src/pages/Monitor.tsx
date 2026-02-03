import { Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useMonitorStats } from '@/features/monitor/hooks'
import { MonitorHeader } from '@/features/monitor/components/MonitorHeader'
import { MonitorStatsGrid } from '@/features/monitor/components/MonitorStatsGrid'
import { MonitorFlujosPorTipo } from '@/features/monitor/components/MonitorFlujosPorTipo'

export default function Monitor() {
  const { data: stats, isLoading, error } = useMonitorStats()

  return (
    <div className="space-y-6">
      <MonitorHeader />

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin">
            <Zap className="h-6 w-6 text-segal-green" />
          </div>
        </div>
      )}

      {(error || !stats) && !isLoading && (
        <Card className="border-segal-red/20 bg-segal-red/5">
          <CardContent className="pt-6">
            <p className="text-segal-red">Error al cargar las estadísticas del monitor</p>
          </CardContent>
        </Card>
      )}

      {stats && !isLoading && (
        <>
          <MonitorStatsGrid stats={stats} />
          <MonitorFlujosPorTipo flujosPorTipo={stats.flujosPorTipo} />
        </>
      )}
    </div>
  )
}
