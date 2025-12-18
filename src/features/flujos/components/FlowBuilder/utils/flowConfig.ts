/**
 * Tipos y funciones para la configuración completa del flujo
 * Principio de Responsabilidad Única: construir y validar configuración
 */

import type { Node as ReactFlowNode } from 'reactflow'
import type {
  StageData,
  ConditionData,
  BranchData,
  VisualNodeData,
  VisualEdgeData,
} from './flowMapper'
import {
  mapStagesToBackend,
  mapConditionsToBackend,
  mapBranchesToBackend,
  mapNodesToVisual,
  mapEdgesToVisual,
  getInitialNode,
  mapEndNodesToBackend,
} from './flowMapper'
import type { EndNodeData } from './flowMapper'
import type { CustomEdge } from '../../../types/flowBuilder'

/**
 * Estructura de configuración visual
 */
export interface FlowVisualConfig {
  nodes: VisualNodeData[]
  edges: VisualEdgeData[]
}

/**
 * Estructura de configuración de la lógica del flujo
 */
export interface FlowStructureConfig {
  stages: StageData[]
  conditions: ConditionData[]
  branches: BranchData[]
  initial_node: string | null // Backend espera el ID del nodo inicial
  end_nodes: EndNodeData[] // Backend espera objetos con node_id, label, description
}

/**
 * Configuración completa del flujo
 */
export interface FlowConfiguration {
  nombre: string
  descripcion: string
  visual: FlowVisualConfig
  structure: FlowStructureConfig
  stages: StageData[] // Compatibilidad con versiones anteriores
}

/**
 * Construye la configuración visual del flujo
 */
export function buildVisualConfig(
  storeNodes: ReactFlowNode[],
  storeEdges: CustomEdge[]
): FlowVisualConfig {
  return {
    nodes: mapNodesToVisual(storeNodes),
    edges: mapEdgesToVisual(storeEdges),
  }
}

/**
 * Construye la configuración estructural del flujo
 */
export function buildStructureConfig(
  storeNodes: ReactFlowNode[],
  storeEdges: CustomEdge[]
): FlowStructureConfig {
  const initialNode = getInitialNode(storeNodes)

  return {
    stages: mapStagesToBackend(storeNodes),
    conditions: mapConditionsToBackend(storeNodes),
    branches: mapBranchesToBackend(storeEdges, storeNodes),
    initial_node: initialNode ? initialNode.id : null,
    end_nodes: mapEndNodesToBackend(storeNodes), // Objetos con node_id, label, description
  }
}

/**
 * Construye la configuración completa del flujo
 */
export function buildFlowConfiguration(
  flowName: string,
  flowDescription: string,
  storeNodes: ReactFlowNode[],
  storeEdges: CustomEdge[]
): FlowConfiguration {
  const visualConfig = buildVisualConfig(storeNodes, storeEdges)
  const structureConfig = buildStructureConfig(storeNodes, storeEdges)
  const stages = structureConfig.stages

  return {
    nombre: flowName,
    descripcion: flowDescription,
    visual: visualConfig,
    structure: structureConfig,
    stages, // Compatibilidad
  }
}

/**
 * Valida que la configuración sea válida (extra checks)
 */
export function isConfigurationValid(config: FlowConfiguration): boolean {
  return (
    config.nombre.trim().length > 0 &&
    config.visual.nodes.length > 0 &&
    config.structure.stages.length > 0
  )
}

/**
 * Registra la configuración para debugging
 */
export function logConfigurationForDebug(config: FlowConfiguration): void {
  console.log('[DEBUG FINAL] Configuración del flujo:', {
    nombre: config.nombre,
    descripcion: config.descripcion,
    etapas: config.structure.stages.length,
    condiciones: config.structure.conditions.length,
    ramas: config.structure.branches.length,
    nodos_visuales: config.visual.nodes.length,
    edges_visuales: config.visual.edges.length,
  })

  console.log('[DEBUG FINAL] config.visual.nodes que se enviará:', config.visual.nodes)
  console.log('[DEBUG FINAL] config.visual completo:', config.visual)
  console.log('[DEBUG FINAL] ✅ STAGES con campo TYPE:', config.structure.stages)
  console.log('[DEBUG FINAL] ✅ CONDITIONS con campo TYPE:', config.structure.conditions)
  console.log('[DEBUG FINAL] ✅ BRANCHES completo:', config.structure.branches)
  console.log('[DEBUG FINAL] 🔵 INITIAL_NODE:', config.structure.initial_node)
  console.log('[DEBUG FINAL] 🔵 END_NODES:', config.structure.end_nodes)
}
