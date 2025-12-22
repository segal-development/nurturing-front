/**
 * Página principal de Gestión de Plantillas
 * Permite ver, crear, editar y eliminar plantillas de SMS y Email
 */

import { useState, useCallback } from 'react'
import { Plus, Mail, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PlantillasTable } from '../components/PlantillasTable'
import { PlantillaCrearDialog } from '../components/PlantillaCrearDialog'
import { PlantillaDetailDialog } from '../components/PlantillaDetailDialog'
import { PlantillaEditarDialog } from '../components/PlantillaEditarDialog'
import { PlantillaEliminarDialog } from '../components/PlantillaEliminarDialog'
import { plantillasService } from '@/api/plantillas.service'
import type { AnyPlantilla } from '@/types/plantilla'

type TipoTab = 'todas' | 'sms' | 'email'

export function PlantillasPage() {
  const queryClient = useQueryClient()
  const [tabActivo, setTabActivo] = useState<TipoTab>('todas')
  const [crearDialogOpen, setCrearDialogOpen] = useState(false)
  const [tipoNuevo, setTipoNuevo] = useState<'sms' | 'email'>('sms')

  // Estados para modales
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<AnyPlantilla | null>(null)
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false)

  const handleAbrirCrear = (tipo: 'sms' | 'email') => {
    setTipoNuevo(tipo)
    setCrearDialogOpen(true)
  }

  // Abrir diálogo de detalles
  const handleVer = useCallback((plantilla: AnyPlantilla) => {
    setPlantillaSeleccionada(plantilla)
    setDetailDialogOpen(true)
  }, [])

  // Abrir diálogo de edición
  const handleEditar = useCallback((plantilla: AnyPlantilla) => {
    setPlantillaSeleccionada(plantilla)
    setEditarDialogOpen(true)
  }, [])

  // Copiar/Duplicar plantilla
  const handleCopiar = useCallback((plantilla: AnyPlantilla) => {
    setTipoNuevo(plantilla.tipo)
    setCrearDialogOpen(true)
    toast.info('Completa los detalles para crear la duplicada')
  }, [])

  // Abrir diálogo de eliminación
  const handleEliminar = useCallback((plantilla: AnyPlantilla) => {
    setPlantillaSeleccionada(plantilla)
    setEliminarDialogOpen(true)
  }, [])

  // Toggle estado activo/inactivo
  const handleToggleEstado = useCallback(
    async (plantilla: AnyPlantilla) => {
      try {
        const nuevoEstado = !plantilla.activo
        await plantillasService.actualizar(plantilla.id!, {
          ...plantilla,
          activo: nuevoEstado,
        })

        // Invalidar cache
        queryClient.invalidateQueries({ queryKey: ['plantillas'] })

        toast.success(
          `Plantilla ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`
        )
      } catch (error: any) {
        console.error('Error toggling estado:', error)
        const mensaje = error.response?.data?.message || 'Error al cambiar estado'
        toast.error(mensaje)
      }
    },
    [queryClient]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-segal-dark dark:text-white flex items-center gap-2">
            <Mail className="h-8 w-8 text-segal-blue dark:text-segal-turquoise" />
            Plantillas
          </h1>
          <p className="text-sm text-segal-dark/60 dark:text-gray-400 mt-1">
            Gestiona plantillas de SMS y Email para tus flujos de nurturing
          </p>
        </div>

        {/* Botones de crear */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleAbrirCrear('sms')}
            className="bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90 text-white dark:text-gray-900 font-semibold flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Plantilla SMS
          </Button>
          <Button
            onClick={() => handleAbrirCrear('email')}
            variant="outline"
            className="border-segal-blue/30 dark:border-gray-600 text-segal-blue dark:text-segal-turquoise hover:bg-segal-blue/5 dark:hover:bg-gray-800 font-semibold flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Plantilla Email
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-segal-blue/10 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setTabActivo('todas')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tabActivo === 'todas'
                ? 'border-segal-blue dark:border-segal-turquoise text-segal-blue dark:text-segal-turquoise'
                : 'border-transparent text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
            }`}
          >
            Todas las Plantillas
          </button>
          <button
            onClick={() => setTabActivo('sms')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tabActivo === 'sms'
                ? 'border-segal-blue dark:border-segal-turquoise text-segal-blue dark:text-segal-turquoise'
                : 'border-transparent text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            SMS
          </button>
          <button
            onClick={() => setTabActivo('email')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tabActivo === 'email'
                ? 'border-segal-blue dark:border-segal-turquoise text-segal-blue dark:text-segal-turquoise'
                : 'border-transparent text-segal-dark/60 dark:text-gray-400 hover:text-segal-dark dark:hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>
      </div>

      {/* Tabla de plantillas */}
      <PlantillasTable
        tipo={tabActivo === 'todas' ? undefined : (tabActivo as 'sms' | 'email')}
        onVerClick={handleVer}
        onEditarClick={handleEditar}
        onCopiarClick={handleCopiar}
        onEliminarClick={handleEliminar}
        onEstadoToggle={handleToggleEstado}
      />

      {/* Dialog para crear plantilla */}
      <PlantillaCrearDialog
        open={crearDialogOpen}
        onOpenChange={setCrearDialogOpen}
        tipoInicial={tipoNuevo}
      />

      {/* Dialog para ver detalles */}
      <PlantillaDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        plantillaId={plantillaSeleccionada?.id}
        onCopy={(plantilla) => {
          handleCopiar(plantilla)
          setDetailDialogOpen(false)
        }}
      />

      {/* Dialog para editar */}
      <PlantillaEditarDialog
        open={editarDialogOpen}
        onOpenChange={setEditarDialogOpen}
        plantilla={plantillaSeleccionada || undefined}
      />

      {/* Dialog para eliminar */}
      <PlantillaEliminarDialog
        open={eliminarDialogOpen}
        onOpenChange={setEliminarDialogOpen}
        plantilla={plantillaSeleccionada || undefined}
      />
    </div>
  )
}
