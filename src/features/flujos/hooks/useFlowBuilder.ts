/**
 * Hook for managing Flow Builder state with React 19 best practices
 * Uses useOptimistic for immediate UI updates and useTransition for async operations
 */

import { useCallback, useOptimistic, useTransition, useState, useReducer } from 'react'
import { nanoid } from 'nanoid'
import type {
  CustomNode,
  CustomEdge,
  FlowBuilderState,
  PendingFlowAction,
  FlowValidationResult,
  StageNodeData,
  ConditionalNodeData,
  SerializedFlowConfig,
  SerializedStage,
} from '../types/flowBuilder'

/**
 * Action types for flow state reducer
 */
type FlowAction =
  | { type: 'ADD_NODE'; payload: CustomNode }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'UPDATE_NODE'; payload: { id: string; data: any } }
  | { type: 'ADD_EDGE'; payload: CustomEdge }
  | { type: 'REMOVE_EDGE'; payload: string }
  | { type: 'SET_FLOW_NAME'; payload: string }
  | { type: 'SET_FLOW_DESCRIPTION'; payload: string }
  | { type: 'SET_TIPO_DEUDOR'; payload: string }
  | { type: 'SET_ORIGIN'; payload: string }
  | { type: 'SET_PROSPECTOS'; payload: Set<number> }
  | { type: 'SET_DISTRIBUTION'; payload: any }
  | { type: 'RESET_FLOW' }

/**
 * Reducer function for flow state
 */
function flowReducer(state: FlowBuilderState, action: FlowAction): FlowBuilderState {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      }
    case 'REMOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.payload),
        edges: state.edges.filter(
          (e) => e.source !== action.payload && e.target !== action.payload
        ),
      }
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, data: { ...n.data, ...action.payload.data } } : n
        ),
      }
    case 'ADD_EDGE':
      return {
        ...state,
        edges: [...state.edges, action.payload],
      }
    case 'REMOVE_EDGE':
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== action.payload),
      }
    case 'SET_FLOW_NAME':
      return { ...state, flowName: action.payload }
    case 'SET_FLOW_DESCRIPTION':
      return { ...state, flowDescription: action.payload }
    case 'SET_TIPO_DEUDOR':
      return { ...state, tipoDeudor: action.payload }
    case 'SET_ORIGIN':
      return { ...state, selectedOriginId: action.payload }
    case 'SET_PROSPECTOS':
      return { ...state, selectedProspectos: action.payload }
    case 'SET_DISTRIBUTION':
      return { ...state, distributionConfig: { ...state.distributionConfig, ...action.payload } }
    case 'RESET_FLOW':
      return getInitialFlowState()
    default:
      return state
  }
}

/**
 * Get initial flow state
 */
function getInitialFlowState(): FlowBuilderState {
  const initialNode: CustomNode = {
    id: 'initial-1',
    data: { label: 'Inicio - Selecciona prospectos' },
    position: { x: 250, y: 50 },
    type: 'initial',
  }

  const endNode: CustomNode = {
    id: 'end-1',
    data: { label: 'Fin' },
    position: { x: 250, y: 500 },
    type: 'end',
  }

  return {
    nodes: [initialNode, endNode],
    edges: [],
    flowName: '',
    flowDescription: '',
    tipoDeudor: '',
    selectedOriginId: null,
    selectedProspectos: new Set(),
    distributionConfig: {
      tipoMensaje: 'email',
      emailPercentage: 50,
      costEmail: 1,
      costSms: 11,
    },
  }
}

/**
 * Main hook for Flow Builder state management
 */
export function useFlowBuilder() {
  const [state, dispatch] = useReducer(flowReducer, getInitialFlowState())
  const [pendingActions, setPendingActions] = useOptimistic<PendingFlowAction[]>([])
  const [isPending, startTransition] = useTransition()
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  /**
   * Add a new stage node to the flow
   * Position: spaciada vertically para evitar que se apilen
   */
  const addStageNode = useCallback(() => {
    // Calcular posición basada en número de nodos existentes
    const stageCount = state.nodes.filter((n) => n.type === 'stage').length
    const newY = 250 + stageCount * 200 // Espaciado vertical: 200px entre etapas

    const newNode: CustomNode = {
      id: `stage-${nanoid()}`,
      data: {
        label: 'Nueva Etapa',
        dia_envio: 1,
        tipo_mensaje: 'email',
        plantilla_mensaje: '',
        activo: true,
      },
      position: {
        x: 400, // Posición X centrada en el canvas
        y: newY, // Posición Y calculada para no apilarse
      },
      type: 'stage',
    }

    dispatch({ type: 'ADD_NODE', payload: newNode })

    startTransition(() => {
      setPendingActions((prev) => [
        ...prev,
        {
          type: 'addNode',
          payload: newNode,
          timestamp: Date.now(),
        },
      ])
    })
  }, [state.nodes])

  /**
   * Add a new conditional node to the flow
   * Position: spaciada vertically para evitar que se apilen
   */
  const addConditionalNode = useCallback(() => {
    // Calcular posición basada en número de nodos existentes
    const nodeCount = state.nodes.length
    const newY = 250 + nodeCount * 150 // Espaciado vertical

    const newNode: CustomNode = {
      id: `conditional-${nanoid()}`,
      data: {
        label: 'Nueva Condición',
        description: '',
        condition: {
          id: `cond-${nanoid()}`,
          type: 'email_opened',
          label: 'Email abierto',
        },
        yesLabel: 'Sí',
        noLabel: 'No',
      } as ConditionalNodeData,
      position: {
        x: 600, // Posición X diferente para distinguir del flujo linear
        y: newY, // Posición Y calculada para no apilarse
      },
      type: 'conditional',
    }

    dispatch({ type: 'ADD_NODE', payload: newNode })

    startTransition(() => {
      setPendingActions((prev) => [
        ...prev,
        {
          type: 'addNode',
          payload: newNode,
          timestamp: Date.now(),
        },
      ])
    })
  }, [state.nodes])

  /**
   * Remove a node and all its connected edges
   */
  const removeNode = useCallback((nodeId: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: nodeId })

    startTransition(() => {
      setPendingActions((prev) => [
        ...prev,
        {
          type: 'removeNode',
          payload: { nodeId },
          timestamp: Date.now(),
        },
      ])
    })
  }, [])

  /**
   * Update node data
   */
  const updateNode = useCallback((nodeId: string, data: any) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, data } })

    startTransition(() => {
      setPendingActions((prev) => [
        ...prev,
        {
          type: 'updateNode',
          payload: { nodeId, data },
          timestamp: Date.now(),
        },
      ])
    })
  }, [])

  /**
   * Add connection between nodes
   */
  const addEdge = useCallback((connection: CustomEdge) => {
    // Validate connection
    const sourceNode = state.nodes.find((n) => n.id === connection.source)
    const targetNode = state.nodes.find((n) => n.id === connection.target)

    if (!sourceNode || !targetNode) {
      setValidationErrors(['Conexión inválida: nodo no encontrado'])
      return
    }

    // Prevent duplicate edges
    if (state.edges.some((e) => e.source === connection.source && e.target === connection.target)) {
      setValidationErrors(['Esta conexión ya existe'])
      return
    }

    dispatch({ type: 'ADD_EDGE', payload: connection })
    setValidationErrors([])

    startTransition(() => {
      setPendingActions((prev) => [
        ...prev,
        {
          type: 'addEdge',
          payload: connection,
          timestamp: Date.now(),
        },
      ])
    })
  }, [state.nodes, state.edges])

  /**
   * Remove edge
   */
  const removeEdge = useCallback((edgeId: string) => {
    dispatch({ type: 'REMOVE_EDGE', payload: edgeId })

    startTransition(() => {
      setPendingActions((prev) => [
        ...prev,
        {
          type: 'removeEdge',
          payload: { edgeId },
          timestamp: Date.now(),
        },
      ])
    })
  }, [])

  /**
   * Validate the entire flow
   */
  const validateFlow = useCallback((): FlowValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate flow name
    if (!state.flowName.trim()) {
      errors.push('El nombre del flujo es requerido')
    }

    // Validate at least one stage
    const stageNodes = state.nodes.filter((n) => n.type === 'stage')
    if (stageNodes.length === 0) {
      errors.push('Debes agregar al menos una etapa')
    }

    // Validate stages have required data
    stageNodes.forEach((node, idx) => {
      const stageData = node.data as StageNodeData
      if (!stageData.plantilla_mensaje) {
        errors.push(`Etapa ${idx + 1}: Plantilla de mensaje requerida`)
      }
      if (!stageData.dia_envio) {
        errors.push(`Etapa ${idx + 1}: Día de envío requerido`)
      }
    })

    // Validate flow is connected
    const initialNode = state.nodes.find((n) => n.type === 'initial')
    if (initialNode && state.edges.length === 0) {
      warnings.push('El flujo no está conectado. Asegúrate de que las etapas estén vinculadas.')
    }

    // Validate prospectos selected
    if (state.selectedProspectos.size === 0) {
      warnings.push('No hay prospectos seleccionados para este flujo')
    }

    setValidationErrors(errors)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }, [state])

  /**
   * Get the final flow configuration for saving
   * Serializes the visual flow into a format the backend can understand
   */
  const getFlowConfig = useCallback((): SerializedFlowConfig => {
    const stageNodes = state.nodes.filter((n) => n.type === 'stage')
    const conditionalNodes = state.nodes.filter((n) => n.type === 'conditional')

    // Build serialized stages
    const stages: SerializedStage[] = stageNodes.map((node) => {
      const data = node.data as StageNodeData
      return {
        id: node.id,
        label: data.label,
        dia_envio: data.dia_envio || 1,
        tipo_mensaje: data.tipo_mensaje || 'email',
        plantilla_mensaje: data.plantilla_mensaje || '',
        oferta_infocom_id: data.oferta_infocom_id,
        activo: data.activo !== false,
        fecha_inicio_personalizada: data.fecha_inicio_personalizada,
      }
    })

    // Build node map for backend to understand the visual layout
    const nodeMap: SerializedFlowConfig['nodeMap'] = {}
    state.nodes.forEach((node) => {
      const nextNodeIds = state.edges
        .filter((e) => e.source === node.id)
        .map((e) => e.target)
      nodeMap[node.id] = {
        type: node.type || 'stage',
        nextNodeIds,
      }
    })

    // Build conditional branches if any
    const branches = conditionalNodes.map((condNode) => {
      const condData = condNode.data as ConditionalNodeData
      const outgoingEdges = state.edges.filter((e) => e.source === condNode.id)

      const trueStageIds = outgoingEdges
        .filter((e) => e.data?.conditionType === 'yes')
        .map((e) => e.target)

      const falseStageIds = outgoingEdges
        .filter((e) => e.data?.conditionType === 'no')
        .map((e) => e.target)

      return {
        conditionNodeId: condNode.id,
        condition: condData.condition,
        trueStageIds,
        falseStageIds,
      }
    })

    return {
      nombre: state.flowName,
      descripcion: state.flowDescription,
      stages,
      branches: branches.length > 0 ? branches : undefined,
      nodeMap,
    }
  }, [state])

  /**
   * Reset flow to initial state
   */
  const resetFlow = useCallback(() => {
    dispatch({ type: 'RESET_FLOW' })
    setValidationErrors([])
  }, [])

  return {
    // State
    state,
    isPending,
    validationErrors,
    pendingActions,

    // Node actions
    addStageNode,
    addConditionalNode,
    removeNode,
    updateNode,

    // Edge actions
    addEdge,
    removeEdge,

    // Flow actions
    setFlowName: (name: string) => dispatch({ type: 'SET_FLOW_NAME', payload: name }),
    setFlowDescription: (desc: string) => dispatch({ type: 'SET_FLOW_DESCRIPTION', payload: desc }),
    setTipoDeudor: (tipo: string) => dispatch({ type: 'SET_TIPO_DEUDOR', payload: tipo }),
    setSelectedOrigin: (originId: string) => dispatch({ type: 'SET_ORIGIN', payload: originId }),
    setSelectedProspectos: (prospectos: Set<number>) =>
      dispatch({ type: 'SET_PROSPECTOS', payload: prospectos }),
    setDistribution: (config: any) => dispatch({ type: 'SET_DISTRIBUTION', payload: config }),

    // Validation
    validateFlow,
    getFlowConfig,
    resetFlow,
  }
}
