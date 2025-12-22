import { useQuery } from '@tanstack/react-query';
import { Users, Send, Calendar, Tag, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { dashboardService } from '@/api/dashboard.service';


// Transform data for nivo Pie chart
// From: { flujo: string, cantidad: number }[]
// To: { id: string, value: number }[]
function transformPieChartData(
  data: Array<{ flujo: string; cantidad: number }>
) {
  return data.map((item) => ({
    id: item.flujo,
    value: item.cantidad,
  }));
}

// Transform data for nivo Line chart
// From: { fecha: string, exitosos: number, fallidos: number }[]
// To: [{ id: string, data: { x: string, y: number }[] }]
function transformLineChartData(
  data: Array<{ fecha: string; exitosos: number; fallidos: number }>
) {
  return [
    {
      id: 'Exitosos',
      data: data.map((item) => ({
        x: item.fecha,
        y: item.exitosos,
      })),
    },
    {
      id: 'Fallidos',
      data: data.map((item) => ({
        x: item.fecha,
        y: item.fallidos,
      })),
    },
  ];
}

export default function Dashboard() {
  // Obtener datos del backend en tiempo real
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Refetch cada 10 minutos
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise mx-auto mb-4" />
          <p className="text-segal-dark/60 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-800 dark:text-red-300">Error al cargar el dashboard</h3>
          <p className="text-sm text-red-700 dark:text-red-400">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header - Segal Corporate */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-segal-dark dark:text-white">Dashboard</h1>
        <p className="text-segal-dark/60 dark:text-gray-400">
          Vista general del sistema de nurturing
        </p>
      </div>

      {/* Stats cards - Segal Corporate Colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-blue/30 dark:hover:border-segal-blue/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70 dark:text-gray-400">
              Total Prospectos
            </CardTitle>
            <Users className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark dark:text-white">
              {formatNumber(stats?.total_prospectos || 0)}
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-500">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-turquoise/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-turquoise/30 dark:hover:border-segal-turquoise/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70 dark:text-gray-400">Envíos Hoy</CardTitle>
            <Send className="h-4 w-4 text-segal-turquoise" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark dark:text-white">
              {formatNumber(stats?.envios_hoy || 0)}
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-500">
              Mensajes enviados
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-orange/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-orange/30 dark:hover:border-orange-500/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70 dark:text-gray-400">
              Envíos Programados
            </CardTitle>
            <Calendar className="h-4 w-4 text-segal-orange dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark dark:text-white">
              {formatNumber(stats?.envios_programados || 0)}
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-500">
              Próximos envíos
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-green/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-green/30 dark:hover:border-green-500/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70 dark:text-gray-400">
              Ofertas Activas
            </CardTitle>
            <Tag className="h-4 w-4 text-segal-green dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark dark:text-white">
              {stats?.ofertas_activas || 0}
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-500">
              Ofertas Infocom
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900 hover:border-segal-blue/30 dark:hover:border-segal-blue/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70 dark:text-gray-400">
              Tasa de Entrega
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark dark:text-white">
              {formatPercentage(stats?.tasa_entrega || 0)}
            </div>
            <p className="text-xs text-segal-dark/60 dark:text-gray-500">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Line chart - Envíos por día */}
        <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-segal-dark dark:text-white">Envíos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <ResponsiveLine
                data={transformLineChartData(stats?.envios_por_dia || [])}
                margin={{ top: 10, right: 30, left: 60, bottom: 40 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 0,
                  max: 'auto',
                }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Fecha',
                  legendOffset: 36,
                  legendPosition: 'middle',
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Cantidad',
                  legendOffset: -46,
                  legendPosition: 'middle',
                }}
                colors={{ scheme: 'set2' }}
                pointSize={6}
                pointColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
                useMesh={true}
                tooltip={({ point }: any) => (
                  <div
                    style={{
                      background: 'white',
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <strong>{point.data.x}</strong>
                    <div>{point.serieId}: {point.data.y}</div>
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pie chart - Prospectos por flujo */}
        <Card className="border-segal-turquoise/10 dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-segal-dark dark:text-white">Distribución de Prospectos por Flujo</CardTitle>
            <p className="text-xs text-segal-dark/60 dark:text-gray-400 mt-1">
              Cantidad total de prospectos en cada flujo de nurturing
            </p>
          </CardHeader>
          <CardContent>
            <div style={{ height: '350px' }}>
              <ResponsivePie
                data={transformPieChartData(stats?.prospectos_por_flujo || [])}
                margin={{ top: 20, right: 100, bottom: 60, left: 100 }}
                innerRadius={0.5}
                padAngle={1.2}
                cornerRadius={4}
                colors={['#086DBD', '#32BFD0', '#78B52E', '#F8991D', '#E74C3C', '#9B59B6']}
                borderWidth={2}
                borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                arcLabelsSkipAngle={5}
                arcLabelsTextColor="#ffffff"
                arcLabelsRadiusOffset={0.6}
                enableArcLinkLabels={true}
                arcLinkLabelsSkipAngle={5}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                tooltip={({ datum }: any) => {
                  const total = (stats?.prospectos_por_flujo || []).reduce(
                    (sum: number, item: any) => sum + item.cantidad,
                    0
                  );
                  const percentage = ((datum.value / total) * 100).toFixed(1);
                  return (
                    <div
                      style={{
                        background: 'white',
                        padding: '12px 16px',
                        border: '2px solid #086DBD',
                        borderRadius: '6px',
                        fontSize: '13px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#086DBD', marginBottom: '4px' }}>
                        {datum.label}
                      </div>
                      <div style={{ color: '#333' }}>
                        Cantidad: <strong>{datum.value.toLocaleString()}</strong>
                      </div>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                        {percentage}% del total
                      </div>
                    </div>
                  );
                }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 80,
                    itemsSpacing: 15,
                    itemWidth: 120,
                    itemHeight: 18,
                    itemTextColor: '#333333',
                    itemDirection: 'left-to-right',
                    symbolSize: 16,
                    symbolShape: 'circle',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemTextColor: '#086DBD',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


