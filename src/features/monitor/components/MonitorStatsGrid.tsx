import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonitorStats } from '@/api/monitor'

interface MonitorStatsGridProps {
  stats: MonitorStats
}

export function MonitorStatsGrid({ stats }: MonitorStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="border-segal-blue/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-segal-dark/70">
            Total de Prospectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-segal-blue">{stats.totalProspectos}</div>
        </CardContent>
      </Card>

      <Card className="border-segal-turquoise/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-segal-dark/70">
            Flujos Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-segal-turquoise">{stats.flujosActivos}</div>
        </CardContent>
      </Card>

      <Card className="border-segal-orange/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-segal-dark/70">
            Ofertas Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-segal-orange">{stats.ofertasActivas}</div>
        </CardContent>
      </Card>

      <Card className="border-segal-green/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-segal-dark/70">
            Envíos Programados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-segal-green">{stats.enviosProgramados}</div>
        </CardContent>
      </Card>

      <Card className="border-segal-blue/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-segal-dark/70">
            Envíos Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-segal-blue">{stats.enviosEnviadosHoy}</div>
        </CardContent>
      </Card>

      <Card className="border-segal-turquoise/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-segal-dark/70">
            Tasa de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-segal-turquoise">{stats.tasaEntrega}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
