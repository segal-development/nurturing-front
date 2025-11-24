import { Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMonitorStats } from '@/features/monitor/hooks'

export default function Monitor() {
  const { data: stats, isLoading, error } = useMonitorStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2">
              <Send className="h-8 w-8 text-segal-green" />
              Monitor de Envíos
            </h1>
            <p className="text-segal-dark/60 mt-2">
              Monitorea el estado y progreso de los envíos
            </p>
          </div>
          <Button className="bg-segal-green hover:bg-segal-green/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
            Enviar Campaña
          </Button>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin">
            <Zap className="h-6 w-6 text-segal-green" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2">
              <Send className="h-8 w-8 text-segal-green" />
              Monitor de Envíos
            </h1>
            <p className="text-segal-dark/60 mt-2">
              Monitorea el estado y progreso de los envíos
            </p>
          </div>
          <Button className="bg-segal-green hover:bg-segal-green/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
            Enviar Campaña
          </Button>
        </div>
        <Card className="border-segal-red/20 bg-segal-red/5">
          <CardContent className="pt-6">
            <p className="text-segal-red">Error al cargar las estadísticas del monitor</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Segal Corporate */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark flex items-center gap-2">
            <Send className="h-8 w-8 text-segal-green" />
            Monitor de Envíos
          </h1>
          <p className="text-segal-dark/60 mt-2">
            Monitorea el estado y progreso de los envíos
          </p>
        </div>
        <Button className="bg-segal-green hover:bg-segal-green/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
          Enviar Campaña
        </Button>
      </div>

      {/* Statistics Grid */}
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

      {/* Flujos por Tipo */}
      <Card className="border-segal-dark/10">
        <CardHeader>
          <CardTitle>Prospectos por Tipo de Flujo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.flujosPorTipo).map(([tipo, cantidad]) => (
              <div key={tipo} className="flex items-center justify-between">
                <span className="text-segal-dark/70 capitalize">{tipo.replace(/-/g, ' ')}</span>
                <span className="px-3 py-1 rounded-full bg-segal-blue/10 text-segal-blue font-medium">
                  {cantidad}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
