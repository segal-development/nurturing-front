/**
 * Envios Filters Component
 * Provides filtering controls for envios list
 */

import type { EnviosFilterOptions } from '@/types/envios'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EnviosFiltersProps {
  filters: EnviosFilterOptions
  onFiltersChange: (filters: Partial<EnviosFilterOptions>) => void
}

export function EnviosFilters({ filters, onFiltersChange }: EnviosFiltersProps) {
  const hasActiveFilters =
    filters.estado || filters.canal || filters.flujo_id || filters.fecha_desde

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-700">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Estado Filter */}
            <div>
              <label className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Estado
              </label>
              <select
                value={filters.estado || ''}
                onChange={(e) =>
                  onFiltersChange({ estado: (e.target.value as any) || undefined })
                }
                className="w-full px-3 py-2 border border-segal-blue/20 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="enviado">Enviado</option>
                <option value="fallido">Fallido</option>
              </select>
            </div>

            {/* Canal Filter */}
            <div>
              <label className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Canal
              </label>
              <select
                value={filters.canal || ''}
                onChange={(e) =>
                  onFiltersChange({ canal: (e.target.value as any) || undefined })
                }
                className="w-full px-3 py-2 border border-segal-blue/20 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="email">📧 Email</option>
                <option value="sms">📱 SMS</option>
              </select>
            </div>

            {/* Flujo Filter */}
            <div>
              <label className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Flujo
              </label>
              <input
                type="number"
                placeholder="ID del flujo"
                value={filters.flujo_id || ''}
                onChange={(e) =>
                  onFiltersChange({
                    flujo_id: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-segal-blue/20 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onFiltersChange({
                      estado: undefined,
                      canal: undefined,
                      flujo_id: undefined,
                      fecha_desde: undefined,
                      fecha_hasta: undefined,
                    })
                  }}
                  className="w-full dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>

          {/* Date range filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-segal-blue/10 dark:border-slate-700 pt-4">
            <div>
              <label className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Desde
              </label>
              <input
                type="date"
                value={filters.fecha_desde || ''}
                onChange={(e) =>
                  onFiltersChange({ fecha_desde: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-segal-blue/20 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-segal-dark dark:text-white mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={filters.fecha_hasta || ''}
                onChange={(e) =>
                  onFiltersChange({ fecha_hasta: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-segal-blue/20 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 text-sm">
              {filters.estado && (
                <span className="bg-segal-blue/10 dark:bg-slate-800 text-segal-blue dark:text-segal-turquoise px-3 py-1 rounded-full text-xs font-medium">
                  Estado: {filters.estado}
                </span>
              )}
              {filters.canal && (
                <span className="bg-segal-blue/10 dark:bg-slate-800 text-segal-blue dark:text-segal-turquoise px-3 py-1 rounded-full text-xs font-medium">
                  Canal: {filters.canal}
                </span>
              )}
              {filters.flujo_id && (
                <span className="bg-segal-blue/10 dark:bg-slate-800 text-segal-blue dark:text-segal-turquoise px-3 py-1 rounded-full text-xs font-medium">
                  Flujo: {filters.flujo_id}
                </span>
              )}
              {filters.fecha_desde && (
                <span className="bg-segal-blue/10 dark:bg-slate-800 text-segal-blue dark:text-segal-turquoise px-3 py-1 rounded-full text-xs font-medium">
                  Desde: {filters.fecha_desde}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default EnviosFilters
