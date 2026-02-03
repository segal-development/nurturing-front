import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/features/costos/hooks'
import { Calendar } from 'lucide-react'
import type { CostoDashboardStats } from '@/api/costos.service'

interface CostosPorDiaTableProps {
  data: CostoDashboardStats['costos_por_dia']
}

export function CostosPorDiaTable({ data }: CostosPorDiaTableProps) {
  return (
    <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 dark:text-white">
          <Calendar className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
          Costos por Día
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-segal-dark/60 dark:text-gray-400 text-center py-8">
            No hay datos para el período seleccionado
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.map((dia) => (
              <div
                key={dia.fecha}
                className="flex items-center justify-between p-3 rounded-lg bg-segal-blue/5 dark:bg-gray-800 hover:bg-segal-blue/10 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-segal-dark dark:text-white">
                    {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-CL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-xs text-segal-dark/60 dark:text-gray-400">
                    {dia.ejecuciones} ejecución{dia.ejecuciones !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(dia.costo_total)}
                  </p>
                  <p className="text-xs text-segal-dark/60 dark:text-gray-400">
                    📧 {formatCurrency(dia.costo_emails)} • 📱 {formatCurrency(dia.costo_sms)}
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
