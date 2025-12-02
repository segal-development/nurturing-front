/**
 * Tabla para mostrar plantillas
 * Con opciones para ver, editar y eliminar
 */

import { useQuery } from '@tanstack/react-query'
import { Loader2, Eye, Trash2, Copy, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { plantillasService } from '@/api/plantillas.service'
import type { AnyPlantilla } from '@/types/plantilla'

interface PlantillasTableProps {
  tipo?: 'sms' | 'email'
  onVerClick?: (plantilla: AnyPlantilla) => void
  onEditarClick?: (plantilla: AnyPlantilla) => void
  onCopiarClick?: (plantilla: AnyPlantilla) => void
  onEliminarClick?: (plantilla: AnyPlantilla) => void
  onEstadoToggle?: (plantilla: AnyPlantilla) => void
}

export function PlantillasTable({
  tipo,
  onVerClick,
  onEditarClick,
  onCopiarClick,
  onEliminarClick,
  onEstadoToggle,
}: PlantillasTableProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['plantillas', tipo],
    queryFn: () =>
      plantillasService.getAll({
        tipo: tipo,
        activo: undefined,
        pagina: 1,
        por_pagina: 50,
      }),
  })

  const plantillas = data?.data || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-segal-blue" />
          <p className="text-segal-dark/60">Cargando plantillas...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-segal-red/30 bg-segal-red/10 p-6">
        <p className="text-segal-red font-medium">
          Error al cargar plantillas: {error instanceof Error ? error.message : 'Desconocido'}
        </p>
      </div>
    )
  }

  if (plantillas.length === 0) {
    return (
      <div className="rounded-lg border border-segal-blue/10 bg-segal-blue/5 p-12 text-center">
        <p className="text-segal-dark/60 text-lg mb-2">No hay plantillas disponibles</p>
        <p className="text-segal-dark/40 text-sm">
          {tipo ? `Crea tu primera plantilla de ${tipo.toUpperCase()}` : 'Crea tu primera plantilla'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-segal-blue/10 overflow-hidden bg-white shadow-sm">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-segal-blue/10 bg-segal-blue/5">
              <th className="px-6 py-3 text-left font-semibold text-segal-dark">Nombre</th>
              <th className="px-6 py-3 text-left font-semibold text-segal-dark">Tipo</th>
              <th className="px-6 py-3 text-left font-semibold text-segal-dark">Descripción</th>
              <th className="px-6 py-3 text-center font-semibold text-segal-dark">Estado</th>
              <th className="px-6 py-3 text-right font-semibold text-segal-dark">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-segal-blue/10">
            {plantillas.map((plantilla) => (
              <tr
                key={plantilla.id}
                className="hover:bg-segal-blue/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-segal-dark">{plantilla.nombre}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      plantilla.tipo === 'sms'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {plantilla.tipo === 'sms' ? '📱 SMS' : '📧 Email'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-segal-dark/60 max-w-xs truncate">
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
                      <ToggleRight className="h-5 w-5 text-segal-green mx-auto" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-segal-dark/40 mx-auto" />
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
                      className="text-segal-blue hover:bg-segal-blue/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Editar plantilla"
                      onClick={() => onEditarClick?.(plantilla)}
                      className="text-segal-blue hover:bg-segal-blue/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Duplicar plantilla"
                      onClick={() => onCopiarClick?.(plantilla)}
                      className="text-segal-blue hover:bg-segal-blue/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Eliminar plantilla"
                      onClick={() => onEliminarClick?.(plantilla)}
                      className="text-segal-red hover:bg-segal-red/10"
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

      {/* Footer */}
      <div className="border-t border-segal-blue/10 bg-segal-blue/5 px-6 py-3">
        <p className="text-sm text-segal-dark/60">
          Total: <span className="font-semibold">{data?.meta.total || 0}</span> plantillas
        </p>
      </div>
    </div>
  )
}
