import { useQuery } from '@tanstack/react-query';
import { Users, Send, Calendar, Tag, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercentage } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data - Reemplazar con llamada a API real
const mockStats = {
  total_prospectos: 1250,
  envios_hoy: 45,
  envios_programados: 320,
  ofertas_activas: 8,
  tasa_entrega: 94.5,
  prospectos_por_flujo: [
    { flujo: 'Deuda 0', cantidad: 450 },
    { flujo: 'Deuda Baja', cantidad: 320 },
    { flujo: 'Deuda Media', cantidad: 280 },
    { flujo: 'Deuda Alta', cantidad: 200 },
  ],
  envios_por_dia: [
    { fecha: '2024-11-11', exitosos: 85, fallidos: 5 },
    { fecha: '2024-11-12', exitosos: 92, fallidos: 3 },
    { fecha: '2024-11-13', exitosos: 78, fallidos: 7 },
    { fecha: '2024-11-14', exitosos: 95, fallidos: 2 },
    { fecha: '2024-11-15', exitosos: 88, fallidos: 4 },
    { fecha: '2024-11-16', exitosos: 91, fallidos: 3 },
    { fecha: '2024-11-17', exitosos: 45, fallidos: 2 },
  ],
};


// Segal Corporate Colors for charts
const COLORS = ['#086DBD', '#32BFD0', '#78B52E', '#F8991D'];

export default function Dashboard() {
  // En producción, esto sería una llamada a la API
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => mockStats,
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page header - Segal Corporate */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-segal-dark">Dashboard</h1>
        <p className="text-segal-dark/60">
          Vista general del sistema de nurturing
        </p>
      </div>

      {/* Stats cards - Segal Corporate Colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-segal-blue/10 hover:border-segal-blue/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70">
              Total Prospectos
            </CardTitle>
            <Users className="h-4 w-4 text-segal-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark">
              {formatNumber(stats?.total_prospectos || 0)}
            </div>
            <p className="text-xs text-segal-dark/60">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-turquoise/10 hover:border-segal-turquoise/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70">Envíos Hoy</CardTitle>
            <Send className="h-4 w-4 text-segal-turquoise" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark">
              {formatNumber(stats?.envios_hoy || 0)}
            </div>
            <p className="text-xs text-segal-dark/60">
              Mensajes enviados
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-orange/10 hover:border-segal-orange/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70">
              Envíos Programados
            </CardTitle>
            <Calendar className="h-4 w-4 text-segal-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark">
              {formatNumber(stats?.envios_programados || 0)}
            </div>
            <p className="text-xs text-segal-dark/60">
              Próximos envíos
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-green/10 hover:border-segal-green/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70">
              Ofertas Activas
            </CardTitle>
            <Tag className="h-4 w-4 text-segal-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark">
              {stats?.ofertas_activas || 0}
            </div>
            <p className="text-xs text-segal-dark/60">
              Ofertas Infocom
            </p>
          </CardContent>
        </Card>

        <Card className="border-segal-blue/10 hover:border-segal-blue/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-segal-dark/70">
              Tasa de Entrega
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-segal-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-segal-dark">
              {formatPercentage(stats?.tasa_entrega || 0)}
            </div>
            <p className="text-xs text-segal-dark/60">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar chart - Envíos por día */}
        <Card className="border-segal-blue/10">
          <CardHeader>
            <CardTitle className="text-segal-dark">Envíos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.envios_por_dia}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-segal-blue)/10" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: 'var(--color-segal-dark)' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fill: 'var(--color-segal-dark)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid var(--color-segal-blue)/20',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="exitosos" fill="var(--color-segal-green)" name="Exitosos" />
                <Bar dataKey="fallidos" fill="var(--color-segal-red)" name="Fallidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart - Prospectos por flujo */}
        <Card className="border-segal-turquoise/10">
          <CardHeader>
            <CardTitle className="text-segal-dark">Prospectos por Flujo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.prospectos_por_flujo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(_entry: any) =>
                    `${_entry.flujo}: ${_entry.cantidad}`
                  }
                  outerRadius={80}
                  fill="var(--color-segal-blue)"
                  dataKey="cantidad"
                >
                  {stats?.prospectos_por_flujo.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid var(--color-segal-turquoise)/20',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


