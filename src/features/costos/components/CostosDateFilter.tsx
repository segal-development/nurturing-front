import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Calendar, Loader2, RefreshCw } from 'lucide-react'

interface CostosDateFilterProps {
  fechaInicio: Date
  fechaFin: Date
  onFechaInicioChange: (date: Date) => void
  onFechaFinChange: (date: Date) => void
  onRefetch: () => void
  isLoading: boolean
}

export function CostosDateFilter({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  onRefetch,
  isLoading,
}: CostosDateFilterProps) {
  const setDateRange = (range: 'week' | 'month' | 'quarter') => {
    const end = new Date()
    const start = new Date()

    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setDate(1)
        break
      case 'quarter':
        start.setMonth(end.getMonth() - 3)
        break
    }

    onFechaInicioChange(start)
    onFechaFinChange(end)
  }

  return (
    <Card className="border-segal-blue/10 dark:border-gray-700 dark:bg-gray-900">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-segal-blue dark:text-segal-turquoise" />
            <span className="text-sm font-medium text-segal-dark dark:text-white">Período:</span>
          </div>

          {/* Quick filters */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('week')}
              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Última semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('month')}
              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Este mes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('quarter')}
              className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Último trimestre
            </Button>
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-2">
            <DatePicker
              date={fechaInicio}
              onDateChange={(date) => date && onFechaInicioChange(date)}
              placeholder="Fecha inicio"
              toDate={fechaFin}
              dateFormat="dd/MM/yyyy"
            />
            <span className="text-segal-dark/40 dark:text-gray-500">→</span>
            <DatePicker
              date={fechaFin}
              onDateChange={(date) => date && onFechaFinChange(date)}
              placeholder="Fecha fin"
              fromDate={fechaInicio}
              toDate={new Date()}
              dateFormat="dd/MM/yyyy"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={isLoading}
            className="ml-auto dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
