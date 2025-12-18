/**
 * Validaciones de flujo antes de guardar
 * Basado en los requisitos del backend Laravel
 */

import type { FlowConfiguration } from './flowConfig'

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Tipos válidos para stages según el backend
 */
const VALID_STAGE_TYPES = ['email', 'sms', 'stage', 'condition', 'end']

/**
 * Valida que el flujo tenga un nodo inicial
 */
function validateInitialNode(config: FlowConfiguration): string[] {
  const errors: string[] = []

  if (!config.structure.initial_node) {
    errors.push('El flujo debe tener un nodo inicial')
    return errors
  }

  // Validar que el initial_node exista en visual.nodes
  const initialNodeExists = config.visual.nodes.some(
    (node) => node.id === config.structure.initial_node
  )

  if (!initialNodeExists) {
    errors.push(
      `El nodo inicial "${config.structure.initial_node}" no existe en la estructura visual`
    )
  }

  return errors
}

/**
 * Valida que el nodo inicial tenga al menos una conexión saliente
 */
function validateInitialNodeConnections(config: FlowConfiguration): string[] {
  const errors: string[] = []

  const hasConnection = config.structure.branches.some(
    (branch) => branch.source_node_id === config.structure.initial_node
  )

  if (!hasConnection) {
    errors.push('El nodo inicial no tiene conexiones salientes')
  }

  return errors
}

/**
 * Valida que todos los stages tengan campo type válido
 */
function validateStageTypes(config: FlowConfiguration): string[] {
  const errors: string[] = []

  for (const stage of config.structure.stages) {
    // Verificar que tenga el campo type
    if (!stage.type || stage.type === null) {
      errors.push(`La etapa "${stage.label}" (${stage.id}) no tiene campo "type" definido`)
      continue
    }

    // Verificar que el type sea válido
    if (!VALID_STAGE_TYPES.includes(stage.type)) {
      errors.push(
        `La etapa "${stage.label}" (${stage.id}) tiene tipo inválido: "${stage.type}". Tipos válidos: ${VALID_STAGE_TYPES.join(', ')}`
      )
    }
  }

  return errors
}

/**
 * Valida que todos los branches apunten a nodos existentes
 * Valida contra visual.nodes que contiene TODOS los nodos del flujo
 */
function validateBranchesIntegrity(config: FlowConfiguration): string[] {
  const errors: string[] = []

  // Crear set de todos los IDs de nodos desde visual.nodes
  // visual.nodes contiene TODOS los nodos (initial, stages, conditions, end)
  const allNodeIds = new Set<string>(
    config.visual.nodes.map((node) => node.id)
  )

  // Validar cada branch
  for (const branch of config.structure.branches) {
    // Validar source_node_id
    if (!allNodeIds.has(branch.source_node_id)) {
      errors.push(
        `Conexión desde nodo inexistente: "${branch.source_node_id}" → "${branch.target_node_id}"`
      )
    }

    // Validar target_node_id
    if (!allNodeIds.has(branch.target_node_id)) {
      errors.push(
        `Conexión hacia nodo inexistente: "${branch.source_node_id}" → "${branch.target_node_id}"`
      )
    }
  }

  return errors
}

/**
 * Valida que haya al menos un stage
 */
function validateHasStages(config: FlowConfiguration): string[] {
  const errors: string[] = []

  if (config.structure.stages.length === 0) {
    errors.push('El flujo debe tener al menos una etapa')
  }

  return errors
}

/**
 * Valida que todos los conditions tengan el campo type
 */
function validateConditionTypes(config: FlowConfiguration): string[] {
  const errors: string[] = []

  for (const condition of config.structure.conditions) {
    if (!condition.type || condition.type === null) {
      errors.push(`La condición "${condition.label}" (${condition.id}) no tiene campo "type" definido`)
    } else if (condition.type !== 'condition') {
      errors.push(
        `La condición "${condition.label}" (${condition.id}) tiene tipo inválido: "${condition.type}". Debe ser "condition"`
      )
    }
  }

  return errors
}

/**
 * Valida la configuración completa del flujo
 * @returns ValidationResult con isValid y array de errores
 */
export function validateFlowConfiguration(config: FlowConfiguration): ValidationResult {
  const allErrors: string[] = []

  // Ejecutar todas las validaciones
  allErrors.push(...validateInitialNode(config))
  allErrors.push(...validateInitialNodeConnections(config))
  allErrors.push(...validateHasStages(config))
  allErrors.push(...validateStageTypes(config))
  allErrors.push(...validateConditionTypes(config))
  allErrors.push(...validateBranchesIntegrity(config))

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  }
}

/**
 * Valida y lanza error si la configuración es inválida
 * Útil para usar en funciones que deben fallar rápido
 */
export function assertFlowConfigurationValid(config: FlowConfiguration): void {
  const result = validateFlowConfiguration(config)

  if (!result.isValid) {
    const errorMessage = `Configuración de flujo inválida:\n${result.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    throw new Error(errorMessage)
  }
}
