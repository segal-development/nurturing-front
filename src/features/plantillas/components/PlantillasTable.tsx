/**
 * Tabla para mostrar plantillas
 * Con opciones para ver, editar y eliminar
 */

import { useQuery } from '@tanstack/react-query'
import { Loader2, Eye, Trash2, Copy, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/shared/Pagination'
import { plantillasService } from '@/api/plantillas.service'
import type { AnyPlantilla, PlantillasResponse } from '@/types/plantilla'

interface PlantillasTableProps {
  tipo?: 'sms' | 'email'
  page: number
  perPage: number
  busqueda?: string
  onPageChange: (page: number) => void
  onVerClick?: (plantilla: AnyPlantilla) => void
  onEditarClick?: (plantilla: AnyPlantilla) => void
  onCopiarClick?: (plantilla: AnyPlantilla) => void
  onEliminarClick?: (plantilla: AnyPlantilla) => void
  onEstadoToggle?: (plantilla: AnyPlantilla) => void
}

export function PlantillasTable({
  tipo,
  page,
  perPage,
  busqueda,
  onPageChange,
  onVerClick,
  onEditarClick,
  onCopiarClick,
  onEliminarClick,
  onEstadoToggle,
}: PlantillasTableProps) {
  const { data, isLoading, isError, error } = useQuery<PlantillasResponse>({
    queryKey: ['plantillas', tipo, page, perPage, busqueda],
    queryFn: () =>
      plantillasService.getAll({
        tipo: tipo,
        activo: undefined,
        pagina: page,
        por_pagina: perPage,
        busqueda: busqueda || undefined,
      }),
  })

  const plantillas = data?.data || []
  const meta = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / perPage) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue dark:text-segal-turquoise" />
          <p className="text-segal-dark/60 dark:text-white/60">Cargando plantillas...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-segal-red/30 bg-segal-red/10 p-6 dark:bg-red-950/30 dark:border-red-800/50">
        <p className="text-segal-red font-medium dark:text-red-400">
          Error al cargar plantillas: {error instanceof Error ? error.message : 'Desconocido'}
        </p>
      </div>
    )
  }

  if (plantillas.length === 0) {
    return (
      <div className="rounded-lg border border-segal-blue/10 bg-segal-blue/5 p-12 text-center dark:bg-slate-800 dark:border-slate-700">
        <p className="text-segal-dark/60 text-lg mb-2 dark:text-white/60">No hay plantillas disponibles</p>
        <p className="text-segal-dark/40 text-sm dark:text-white/40">
          {tipo ? `Crea tu primera plantilla de ${tipo.toUpperCase()}` : 'Crea tu primera plantilla'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-segal-blue/10 overflow-hidden bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-segal-blue/10 bg-segal-blue/5 dark:bg-slate-800 dark:border-slate-700">
              <th className="px-6 py-3 text-left font-semibold text-segal-dark dark:text-white">Nombre</th>
              <th className="px-6 py-3 text-left font-semibold text-segal-dark dark:text-white">Tipo</th>
              <th className="px-6 py-3 text-left font-semibold text-segal-dark dark:text-white">Descripción</th>
              <th className="px-6 py-3 text-center font-semibold text-segal-dark dark:text-white">Estado</th>
              <th className="px-6 py-3 text-right font-semibold text-segal-dark dark:text-white">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-segal-blue/10 dark:divide-slate-700">
            {plantillas.map((plantilla) => (
              <tr
                key={plantilla.id}
                className="hover:bg-segal-blue/5 transition-colors dark:hover:bg-slate-800"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-segal-dark dark:text-white">{plantilla.nombre}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      plantilla.tipo === 'sms'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                    }`}
                  >
                    {plantilla.tipo === 'sms' ? '📱 SMS' : '📧 Email'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-segal-dark/60 max-w-xs truncate dark:text-white/60">
                    {plantilla.descripcion || '—'}
                  </p>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onEstadoToggle?.(plantilla)}
                    title={plantilla.activo ? 'Desactivar' : 'Activar'}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {plantilla.activo ? (
                      <ToggleRight className="h-5 w-5 text-segal-green dark:text-emerald-400 mx-auto" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-segal-dark/40 dark:text-white/40 mx-auto" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ver plantilla"
                      onClick={() => onVerClick?.(plantilla)}
                      className="text-segal-blue hover:bg-segal-blue/10 dark:text-segal-turquoise dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Editar plantilla"
                      onClick={() => onEditarClick?.(plantilla)}
                      className="text-segal-blue hover:bg-segal-blue/10 dark:text-segal-turquoise dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Duplicar plantilla"
                      onClick={() => onCopiarClick?.(plantilla)}
                      className="text-segal-blue hover:bg-segal-blue/10 dark:text-segal-turquoise dark:hover:bg-slate-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Eliminar plantilla"
                      onClick={() => onEliminarClick?.(plantilla)}
                      className="text-segal-red hover:bg-segal-red/10 dark:text-red-400 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con info y paginación */}
      <div className="border-t border-segal-blue/10 bg-segal-blue/5 px-6 py-3 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-segal-dark/60 dark:text-white/60">
            Mostrando{' '}
            <span className="font-semibold">
              {meta ? ((page - 1) * perPage) + 1 : 0}
            </span>
            {' '}a{' '}
            <span className="font-semibold">
              {meta ? Math.min(page * perPage, meta.total) : 0}
            </span>
            {' '}de{' '}
            <span className="font-semibold text-segal-blue dark:text-segal-turquoise">
              {meta?.total || 0}
            </span>
            {' '}plantillas
          </p>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
