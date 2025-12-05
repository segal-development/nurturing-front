/**
 * Mock Data Generators for Envios
 * Generates realistic test data for shipments and execution monitoring
 * No external dependencies - uses only built-in JavaScript functions
 *
 * Note: Uses 'any' types in places where exact type matching is not critical
 * for test data generation. This is acceptable for mock/test data only.
 */

import type { Envio, EnvioEstado, EnvioCanal } from '@/types/envios'
import type { FlowExecution, ExecutionMetrics, ExecutionEvent } from '@/types/flowExecution'

// Helper functions for random data generation
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
const randomEmail = () => `user${randomInt(1, 9999)}@example.com`
const randomPhone = () => `+56 9 ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`
const randomUUID = () => `uuid-${randomInt(100000, 999999)}`
const randomDate = (daysAgo: number = 30): Date => {
  const date = new Date()
  date.setDate(date.getDate() - randomInt(0, daysAgo))
  return date
}

const companyNames = ['Acme Corp', 'TechStart', 'GlobalSolutions', 'DataDriven', 'CloudFirst', 'FutureWorks']
const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Roberto', 'Patricia', 'Miguel', 'Laura']
const lastNames = ['García', 'López', 'Rodríguez', 'Martínez', 'Pérez', 'Sánchez', 'González', 'Morales']

const randomName = () => `${randomChoice(firstNames)} ${randomChoice(lastNames)}`
const randomCompanyName = () => randomChoice(companyNames)

const errorMessages = [
  'Invalid email address',
  'Phone number not found',
  'Recipient unsubscribed',
  'Email bounced',
  'Network timeout',
  'Server error',
]

const messageTypes: any[] = ['email', 'sms', 'ambos']

/**
 * Generate a realistic Envio object
 */
export function generateEnvio(overrides?: Partial<Envio>): Envio {
  const canal: EnvioCanal = randomChoice(['email', 'sms'])
  const estados: EnvioEstado[] = ['pendiente', 'enviado', 'fallido']
  const estado: EnvioEstado = randomChoice(estados)

  const baseDate = randomDate(365)
  const sentDate = estado !== 'pendiente' ? new Date(baseDate.getTime() + randomInt(60000, 300000)) : undefined

  return {
    id: randomInt(1, 100000),
    flujo_id: randomInt(1, 50),
    prospecto_id: randomInt(1, 10000),
    estado,
    canal,
    fecha_creacion: baseDate.toISOString(),
    fecha_enviado: sentDate?.toISOString(),
    contenido: `This is a sample message content for testing purposes. It could be an email body or SMS text.
      Generated at ${new Date().toISOString()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    metadata: {
      destinatario: canal === 'email' ? randomEmail() : randomPhone(),
      asunto: canal === 'email' ? `Subject Line ${randomInt(1, 1000)}` : undefined,
      error: estado === 'fallido' ? randomChoice(errorMessages) : undefined,
    },
    prospecto: {
      id: randomInt(1, 10000),
      nombre: randomName(),
      email: randomEmail(),
      telefono: randomPhone(),
      estado: 'activo' as const,
      tipo_prospecto_id: randomInt(1, 5),
      monto_deuda: randomInt(0, 100000),
      fecha_ultimo_contacto: randomDate(30).toISOString(),
      origen: 'manual',
    } as any,
    flujo: {
      id: randomInt(1, 50),
      nombre: randomCompanyName(),
      descripcion: `Flow for ${randomCompanyName()}`,
    } as any,
    etapa: {
      id: randomInt(1, 20),
      flujo_id: randomInt(1, 50),
      dia_envio: randomInt(1, 30),
      tipo_mensaje: randomChoice(messageTypes) as any,
      activo: true,
      created_at: randomDate(90).toISOString(),
      updated_at: randomDate(7).toISOString(),
    },
    ...overrides,
  }
}

/**
 * Generate multiple Envios
 */
export function generateEnvios(count: number = 10, overrides?: Partial<Envio>): Envio[] {
  return Array.from({ length: count }, () => generateEnvio(overrides))
}

/**
 * Generate realistic execution metrics
 */
export function generateExecutionMetrics(
  totalProspectos: number = 100,
  overrides?: Partial<ExecutionMetrics>,
): ExecutionMetrics {
  const enviados = randomInt(0, totalProspectos)
  const fallidos = randomInt(0, totalProspectos - enviados)
  const pendientes = totalProspectos - enviados - fallidos

  return {
    total_prospectos: totalProspectos,
    total_enviados: enviados,
    total_fallidos: fallidos,
    total_pendientes: pendientes,
    tasa_exito: totalProspectos > 0 ? Math.round((enviados / totalProspectos) * 100) : 0,
    tiempo_promedio_ms: randomInt(500, 3000),
    tiempo_estimado_restante_ms: randomInt(10000, 300000),
    ...overrides,
  }
}

/**
 * Generate an execution event
 */
export function generateExecutionEvent(overrides?: Partial<ExecutionEvent>): ExecutionEvent {
  const tipos: any[] = ['inicio', 'etapa_iniciada', 'envio_iniciado', 'envio_completado', 'envio_fallido', 'etapa_completada', 'completado']

  return {
    id: randomUUID(),
    flujo_id: randomInt(1, 50),
    tipo: randomChoice(tipos),
    timestamp: new Date().toISOString(),
    mensaje: `Event message ${randomInt(1, 1000)}`,
    datos: {
      envio_id: randomInt(1, 100000),
      prospecto_id: randomInt(1, 10000),
      etapa_id: randomInt(1, 20),
    },
    ...overrides,
  }
}

/**
 * Generate multiple execution events
 */
export function generateExecutionEvents(count: number = 20, overrides?: Partial<ExecutionEvent>): ExecutionEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date()
    timestamp.setTime(timestamp.getTime() - (20 - i) * 60000) // Spread events over time
    return generateExecutionEvent({
      timestamp: timestamp.toISOString(),
      ...overrides,
    })
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

/**
 * Generate a complete flow execution
 */
export function generateFlowExecution(
  overrides?: Partial<FlowExecution>,
): FlowExecution {
  const totalProspectos = randomInt(50, 500)
  const startDate = randomDate(365)
  const isCompleted = randomInt(0, 1) === 1
  const endDate = isCompleted ? new Date(startDate.getTime() + randomInt(300000, 3600000)) : undefined

  return {
    id: randomUUID(),
    flujo_id: randomInt(1, 50),
    estado: isCompleted ? 'completado' : 'en_progreso',
    fecha_inicio: startDate.toISOString(),
    fecha_fin: endDate?.toISOString(),
    metricas: generateExecutionMetrics(totalProspectos),
    eventos: generateExecutionEvents(randomInt(10, 50)),
    ...overrides,
  }
}

/**
 * Generate multiple flow executions
 */
export function generateFlowExecutions(count: number = 10, overrides?: Partial<FlowExecution>): FlowExecution[] {
  return Array.from({ length: count }, () => generateFlowExecution(overrides))
}

/**
 * Generate realistic batch of envios with various states
 */
export function generateRealisticEnviosBatch(count: number = 100) {
  const envios: Envio[] = []

  // 70% enviados exitosamente
  const exitosos = Math.floor(count * 0.7)
  envios.push(
    ...generateEnvios(exitosos, {
      estado: 'enviado' as EnvioEstado,
    }),
  )

  // 20% pendientes
  const pendientes = Math.floor(count * 0.2)
  envios.push(
    ...generateEnvios(pendientes, {
      estado: 'pendiente' as EnvioEstado,
    }),
  )

  // 10% fallidos
  const fallidos = count - exitosos - pendientes
  envios.push(
    ...generateEnvios(fallidos, {
      estado: 'fallido' as EnvioEstado,
    }),
  )

  return envios.sort(() => randomInt(-1, 1))
}
