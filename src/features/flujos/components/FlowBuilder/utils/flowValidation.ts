/**
 * Funciones de validación para el Flow Builder
 * Principio de Responsabilidad Única: solo validar
 */

import type { Node as ReactFlowNode } from 'reactflow'

export interface FlowValidationError {
  isValid: boolean
  message?: string
  code?: 'MISSING_NAME' | 'NO_STAGES' | 'INVALID_PLANTILLAS' | 'VALID'
}

/**
 * Valida que el nombre del flujo no esté vacío
 */
export function validateFlowName(flowName: string): FlowValidationError {
  if (!flowName.trim()) {
    return {
      isValid: false,
      message: 'Por favor ingresa un nombre para el flujo',
      code: 'MISSING_NAME',
    }
  }
  return { isValid: true, code: 'VALID' }
}

/**
 * Valida que exista al menos una etapa
 */
export function validateHasStages(storeNodes: ReactFlowNode[]): FlowValidationError {
  const stageCount = storeNodes.filter((n) => n.type === 'stage').length
  if (stageCount === 0) {
    return {
      isValid: false,
      message: 'Debes agregar al menos una etapa',
      code: 'NO_STAGES',
    }
  }
  return { isValid: true, code: 'VALID' }
}

/**
 * Valida que cada etapa tenga una plantilla configurada
 */
export function validateStagePlantillas(storeNodes: ReactFlowNode[]): FlowValidationError {
  const stages = storeNodes.filter((n) => n.type === 'stage')

  for (const stage of stages) {
    const data = stage.data as any

    // Validar que tenga plantilla según el tipo de mensaje
    if (!data.plantilla_type || data.plantilla_type === 'inline') {
      // Si es inline, debe tener contenido
      if (!data.plantilla_mensaje || data.plantilla_mensaje.trim() === '') {
        return {
          isValid: false,
          message: `La etapa "${data.label}" no tiene plantilla configurada`,
          code: 'INVALID_PLANTILLAS',
        }
      }
    } else if (data.plantilla_type === 'reference') {
      // Si es referencia, debe tener plantilla_id (o plantilla_id_email para ambos)
      const hasPlantillaRef = data.plantilla_id || data.plantilla_id_email
      if (!hasPlantillaRef) {
        return {
          isValid: false,
          message: `La etapa "${data.label}" no tiene plantilla seleccionada`,
          code: 'INVALID_PLANTILLAS',
        }
      }
    }
  }

  return { isValid: true, code: 'VALID' }
}

/**
 * Ejecuta validaciones en orden
 */
export function validateFlow(flowName: string, storeNodes: ReactFlowNode[]): FlowValidationError {
  const nameValidation = validateFlowName(flowName)
  if (!nameValidation.isValid) return nameValidation

  const stagesValidation = validateHasStages(storeNodes)
  if (!stagesValidation.isValid) return stagesValidation

  const plantillasValidation = validateStagePlantillas(storeNodes)
  if (!plantillasValidation.isValid) return plantillasValidation

  return { isValid: true, code: 'VALID' }
}
