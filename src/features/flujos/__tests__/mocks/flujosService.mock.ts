/**
 * Mock implementations for flujos.service.ts
 * Used across all flujos feature tests
 */

import { vi } from 'vitest'
import type {
  FlujoNurturing,
  OpcionesFlujos,
  FlujoResponse,
  EjecucionFlujo,
} from '@/types/flujo'

/**
 * Default mock flujo data
 */
export const mockFlujoNurturing: FlujoNurturing = {
  id: 1,
  nombre: 'Test Flow',
  descripcion: 'Test flow description',
  tipo_prospecto: 'persona',
  origen_id: 1,
  activo: true,
  config_visual: {
    nodes: [
      { id: 'node-1', type: 'initial', position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
      { id: 'node-2', type: 'stage', position: { x: 200, y: 0 }, data: { label: 'Etapa 1' } },
    ],
    edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
  },
  config_structure: {
    stages: [{ id: 1, dia_envio: 1, tipo_mensaje: 'email', plantilla_mensaje: 'Test template' }],
    conditions: [],
    branches: [],
    nodeMap: { 'node-2': 1 },
  },
  etapas: [
    {
      id: 1,
      flujo_id: 1,
      dia_envio: 1,
      tipo_mensaje: 'email',
      plantilla_mensaje: 'Test template',
      oferta_infocom_id: null,
      activo: true,
    },
  ],
  estadisticas: {
    total_prospectos: 100,
    prospectos_pendientes: 50,
    prospectos_completados: 40,
    prospectos_fallidos: 10,
    tasa_apertura: 65,
    tasa_click: 30,
  },
  flujo_ejecuciones: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

/**
 * Mock opciones for filters
 */
export const mockOpcionesFlujos: OpcionesFlujos = {
  origenes: [
    { id: 1, nombre: 'Web', total_flujos: 5 },
    { id: 2, nombre: 'Email', total_flujos: 3 },
  ],
  tipos_deudor: [
    { value: 'persona', label: 'Persona' },
    { value: 'empresa', label: 'Empresa' },
  ],
}

/**
 * Mock response for flujos listing
 */
export const mockFlujoResponse: FlujoResponse = {
  data: [mockFlujoNurturing],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 3,
    links: [],
    path: 'http://api.test/flujos',
    per_page: 15,
    to: 15,
    total: 50,
  },
}

/**
 * Mock ejecución (execution)
 */
export const mockEjecucionFlujo: EjecucionFlujo = {
  id: 1,
  flujo_id: 1,
  estado: 'completado',
  fecha_inicio: '2024-01-01T10:00:00Z',
  fecha_fin: '2024-01-01T18:00:00Z',
  total_prospectos: 100,
  enviados: 100,
  fallidos: 0,
  pendientes: 0,
  email_enviados: 70,
  email_fallidos: 0,
  sms_enviados: 30,
  sms_fallidos: 0,
  porcentaje_completado: 100,
}

/**
 * Create mock flujos service
 */
export const createMockFlujosService = () => {
  return {
    getOpciones: vi.fn().mockResolvedValue(mockOpcionesFlujos),

    getAll: vi.fn().mockResolvedValue(mockFlujoResponse),

    getById: vi.fn().mockResolvedValue(mockFlujoNurturing),

    createWithProspectos: vi.fn().mockResolvedValue({
      ...mockFlujoNurturing,
      id: 2,
      nombre: 'New Flow',
    }),

    create: vi.fn().mockResolvedValue(mockFlujoNurturing),

    update: vi.fn().mockResolvedValue(mockFlujoNurturing),

    delete: vi.fn().mockResolvedValue({
      mensaje: 'Flujo eliminado correctamente',
      detalles: { etapas_eliminadas: 1, ejecutariones_eliminadas: 0 },
    }),

    ejecutarFlujo: vi.fn().mockResolvedValue({
      id: 1,
      estado: 'en_progreso',
      fecha_inicio_programada: null,
    }),

    obtenerProgreso: vi.fn().mockResolvedValue(mockEjecucionFlujo),

    obtenerHistorialEjecuciones: vi.fn().mockResolvedValue({
      data: [mockEjecucionFlujo],
    }),
  }
}

/**
 * Utility: Configure mock service to reject with error
 */
export const configureServiceError = (
  service: ReturnType<typeof createMockFlujosService>,
  method: keyof typeof service,
  error: Error
) => {
  ;(service[method] as any).mockRejectedValueOnce(error)
}

/**
 * Utility: Get mock flujo with custom fields
 */
export const createMockFlujo = (overrides: Partial<FlujoNurturing> = {}): FlujoNurturing => {
  return { ...mockFlujoNurturing, ...overrides }
}

/**
 * Utility: Get mock flujo list
 */
export const createMockFlujoList = (count: number): FlujoResponse => {
  const flujos = Array.from({ length: count }, (_, i) =>
    createMockFlujo({
      id: i + 1,
      nombre: `Test Flow ${i + 1}`,
    })
  )

  return {
    data: flujos,
    meta: {
      ...mockFlujoResponse.meta,
      total: count,
      last_page: Math.ceil(count / 15),
    },
  }
}
