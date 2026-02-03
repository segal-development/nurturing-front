import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/features/costos/hooks'
import { BarChart3 } from 'lucide-react'
import type { CostoDashboardStats } from '@/api/costos.service'

interface CostosPorFlujoTableProps {
  data: CostoDashboardStats['costos_por_flujo']
}

export function CostosPorFlujoTable({ data }: CostosPorFlujoTableProps) {
  return (
    <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 dark:text-white">
          <BarChart3 className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
          Costos por Flujo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-segal-dark/60 dark:text-gray-400 text-center py-8">
            No hay datos para el período seleccionado
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.map((flujo) => (
              <div
                key={flujo.flujo_id}
                className="flex items-center justify-between p-3 rounded-lg bg-segal-blue/5 dark:bg-gray-800 hover:bg-segal-blue/10 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-segal-dark dark:text-white truncate">
                    {flujo.flujo_nombre}
                  </p>
                  <p className="text-xs text-segal-dark/60 dark:text-gray-400">
                    {flujo.ejecuciones} ejecución{flujo.ejecuciones !== 1 ? 'es' : ''} •
                    📧 {flujo.total_emails} • 📱 {flujo.total_sms}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(flujo.costo_total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
