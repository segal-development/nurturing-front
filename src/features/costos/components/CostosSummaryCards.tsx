import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/features/costos/hooks'
import {
  BarChart3,
  DollarSign,
  Mail,
  Smartphone,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { CostoDashboardStats } from '@/api/costos.service'

interface CostosSummaryCardsProps {
  resumen: CostoDashboardStats['resumen']
  preciosActuales: CostoDashboardStats['precios_actuales']
  comparacionEstimadoReal: CostoDashboardStats['comparacion_estimado_real']
}

export function CostosSummaryCards({
  resumen,
  preciosActuales,
  comparacionEstimadoReal,
}: CostosSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Cost */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <DollarSign className="h-4 w-4" />
            Costo Total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(resumen.costo_total)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
            {resumen.total_ejecuciones} ejecuciones
          </p>
        </CardContent>
      </Card>

      {/* Email Cost */}
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Mail className="h-4 w-4" />
            Costo Emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">
            {formatCurrency(resumen.costo_emails)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            {resumen.total_emails?.toLocaleString()} enviados • ${preciosActuales.email}/email
          </p>
        </CardContent>
      </Card>

      {/* SMS Cost */}
      <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/50 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Smartphone className="h-4 w-4" />
            Costo SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-800 dark:text-green-300">
            {formatCurrency(resumen.costo_sms)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            {resumen.total_sms?.toLocaleString()} enviados • ${preciosActuales.sms}/SMS
          </p>
        </CardContent>
      </Card>

      {/* Estimated vs Real */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/50 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <BarChart3 className="h-4 w-4" />
            Estimado vs Real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {comparacionEstimadoReal.diferencia_porcentaje > 0 ? (
              <TrendingUp className="h-5 w-5 text-red-500 dark:text-red-400" />
            ) : comparacionEstimadoReal.diferencia_porcentaje < 0 ? (
              <TrendingDown className="h-5 w-5 text-green-500 dark:text-green-400" />
            ) : null}
            <p className={`text-3xl font-bold ${
              comparacionEstimadoReal.diferencia_porcentaje > 0
                ? 'text-red-600 dark:text-red-400'
                : comparacionEstimadoReal.diferencia_porcentaje < 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-purple-800 dark:text-purple-300'
            }`}>
              {comparacionEstimadoReal.diferencia_porcentaje > 0 ? '+' : ''}
              {comparacionEstimadoReal.diferencia_porcentaje}%
            </p>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Est: {formatCurrency(comparacionEstimadoReal.total_estimado)} →
            Real: {formatCurrency(comparacionEstimadoReal.total_real)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
