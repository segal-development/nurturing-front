/**
 * Editor Visual de Flujos
 * Permite editar flujos existentes en un canvas similar al constructor
 * Características:
 * - Cargar flujo existente en el canvas
 * - Editar nodos, conexiones, agregar/eliminar elementos
 * - Cambiar nombres, fechas, tipos de mensajes
 * - Guardar cambios
 */

import { useEffect, useCallback } from 'react'
import { useFlowBuilderStore } from '../../stores/flowBuilderStore'
import { FlowBuilder } from '../FlowBuilder/FlowBuilder'
import type { FlujoNurturing, EtapaFlujo, CondicionFlujo, RamificacionFlujo, NodoFinalFlujo } from '@/types/flujo'
import type { CustomNode, CustomEdge, StageNodeData, ConditionalNodeData } from '../../types/flowBuilder'
import { toast } from 'sonner'

interface EditFlujoBuilderProps {
  flujo: FlujoNurturing
  onSaveFlow?: (config: any) => Promise<void>
  onCancel?: () => void
}

/**
 * Convierte una etapa del backend a un nodo ReactFlow
 */
function createStageNodeFromEtapa(
  etapa: EtapaFlujo,
  index: number
): CustomNode {
  return {
    id: `stage-${etapa.id}`,
    data: {
      label: `Etapa ${index + 1}`,
      dia_envio: etapa.dia_envio,
      tipo_mensaje: etapa.tipo_mensaje,
      plantilla_mensaje: etapa.plantilla_mensaje,
      oferta_infocom_id: etapa.oferta_infocom_id,
      oferta: etapa.oferta,
      activo: etapa.activo,
    } as StageNodeData,
    position: { x: 400, y: 250 + index * 200 },
    type: 'stage',
  }
}

/**
 * Convierte una condición del backend a un nodo ReactFlow condicional
 */
function createConditionalNodeFromCondicion(
  condicion: CondicionFlujo,
  index: number
): CustomNode {
  return {
    id: `conditional-${condicion.id}`,
    data: {
      label: condicion.descripcion || `Condición ${index + 1}`,
      description: condicion.descripcion,
      condition: {
        id: String(condicion.id),
        label: condicion.tipo,
        type: 'custom' as const,
      },
      yesLabel: 'Sí',
      noLabel: 'No',
    } as ConditionalNodeData,
    position: { x: 600, y: 250 + index * 150 },
    type: 'conditional',
  }
}

/**
 * Convierte un nodo final del backend a un nodo ReactFlow
 */
function createEndNodeFromNodoFinal(
  nodoFinal: NodoFinalFlujo,
  index: number
): CustomNode {
  return {
    id: `end-${nodoFinal.id}`,
    data: {
      label: nodoFinal.descripcion || `Fin ${index + 1}`,
      description: nodoFinal.descripcion,
    },
    position: { x: 400, y: 250 + index * 200 },
    type: 'end',
  }
}

/**
 * Convierte una ramificación del backend a un edge ReactFlow
 */
function createEdgeFromRamificacion(
  ramificacion: RamificacionFlujo,
  nodeMap: Map<number, string>
): CustomEdge {
  const sourceId = nodeMap.get(ramificacion.nodo_origen_id)
  const targetId = nodeMap.get(ramificacion.nodo_destino_id)

  return {
    id: `edge-${ramificacion.id}`,
    source: sourceId || `node-${ramificacion.nodo_origen_id}`,
    target: targetId || `node-${ramificacion.nodo_destino_id}`,
    data: {
      label: ramificacion.etiqueta,
    },
    animated: true,
  } as CustomEdge
}

/**
 * Editor Visual para flujos existentes
 * Reutiliza FlowBuilder pero inicializa con datos del flujo
 */
export function EditFlujoBuilder({
  flujo,
  onSaveFlow,
  onCancel,
}: EditFlujoBuilderProps) {
  const {
    setFlowName,
    setFlowDescription,
    loadFlowConfiguration,
    resetFlow,
  } = useFlowBuilderStore()

  // Inicializar el flujo cuando se carga el componente
  useEffect(() => {
    console.log('📥 Cargando flujo para edición:', flujo)

    // Resetear el store primero para limpiar estado anterior
    resetFlow()

    // Si el flujo ya tiene configuración visual, usarla
    if (flujo.config_visual?.nodes && flujo.config_visual?.edges) {
      console.log('✅ Usando configuración visual existente del flujo')
      setFlowName(flujo.nombre)
      setFlowDescription(flujo.descripcion || '')
      loadFlowConfiguration(flujo.config_visual.nodes, flujo.config_visual.edges)
      toast.info(`Flujo "${flujo.nombre}" cargado para edición`)
      return
    }

    // Crear un mapeo de IDs: id backend -> id ReactFlow node
    const nodeMap = new Map<number, string>()
    const nodes: CustomNode[] = []

    // Nodo inicial
    const initialNode: CustomNode = {
      id: 'initial-1',
      data: {
        label: `Inicio - ${flujo.origen || 'Flujo'}`,
        origen_id: flujo.origen_id,
        origen_nombre: flujo.origen,
      },
      position: { x: 400, y: 50 },
      type: 'initial',
    }
    nodes.push(initialNode)

    // Cargar etapas (stages) - Backend devuelve en flujo_etapas
    const etapas = flujo.flujo_etapas || flujo.etapas || []
    if (etapas.length > 0) {
      console.log('📊 Cargando etapas:', etapas.length)
      etapas.forEach((etapa: EtapaFlujo, index: number) => {
        const node = createStageNodeFromEtapa(etapa, index)
        nodes.push(node)
        nodeMap.set(etapa.id, node.id)
      })
    }

    // Cargar condiciones - Backend devuelve en flujo_condiciones
    const condiciones = flujo.flujo_condiciones || []
    if (condiciones.length > 0) {
      console.log('⚙️ Cargando condiciones:', condiciones.length)
      condiciones.forEach((condicion: CondicionFlujo, index: number) => {
        const node = createConditionalNodeFromCondicion(condicion, index)
        nodes.push(node)
        nodeMap.set(condicion.id, node.id)
      })
    }

    // Cargar nodos finales - Backend devuelve en flujo_nodos_finales
    const nodosFinales = flujo.flujo_nodos_finales || []
    if (nodosFinales.length > 0) {
      console.log('🏁 Cargando nodos finales:', nodosFinales.length)
      nodosFinales.forEach((nodoFinal: NodoFinalFlujo, index: number) => {
        const node = createEndNodeFromNodoFinal(nodoFinal, index)
        nodes.push(node)
        nodeMap.set(nodoFinal.id, node.id)
      })
    }

    // Cargar ramificaciones (edges) - Backend devuelve en flujo_ramificaciones
    const edges: CustomEdge[] = []
    const ramificaciones = flujo.flujo_ramificaciones || []
    if (ramificaciones.length > 0) {
      console.log('🔗 Cargando ramificaciones:', ramificaciones.length)
      ramificaciones.forEach((ramificacion: RamificacionFlujo) => {
        const edge = createEdgeFromRamificacion(ramificacion, nodeMap)
        edges.push(edge)
      })
    }

    console.log('✅ Flujo reconstruido:', {
      nodes: nodes.length,
      edges: edges.length,
      etapas: etapas.length,
      condiciones: condiciones.length,
      nodosFinales: nodosFinales.length,
      ramificaciones: ramificaciones.length,
    })

    // Establecer nombre y descripción
    setFlowName(flujo.nombre)
    setFlowDescription(flujo.descripcion || '')

    // Cargar nodes y edges en el store
    loadFlowConfiguration(nodes, edges)

    toast.info(`Flujo "${flujo.nombre}" cargado para edición`)
  }, [flujo, setFlowName, setFlowDescription, loadFlowConfiguration, resetFlow])

  const handleSaveFlow = useCallback(
    async (config: any) => {
      console.log('💾 Guardando flujo editado:', config)
      if (onSaveFlow) {
        await onSaveFlow(config)
      }
    },
    [onSaveFlow]
  )

  return (
    <FlowBuilder
      onSaveFlow={handleSaveFlow}
      onCancel={onCancel}
      initialName={flujo.nombre}
      initialDescription={flujo.descripcion || ''}
    />
  )
}
