/**
 * Mock data para envíos realizados
 * Contiene histórico de envíos con estados, fechas y ofertas asociadas
 */

export type EstadoEnvio = 'pendiente' | 'enviado' | 'fallido' | 'abierto' | 'aceptado'
export type CanalEnvio = 'email' | 'sms' | 'push'

export interface Envio {
  id: number
  flujoId: number
  prospectoId: number
  fechaEnvio: string
  estado: EstadoEnvio
  canal: CanalEnvio
  ofertaUtilizada?: number
  mensaje: string
  tasaApertura?: number
  clicks?: number
}

export const MOCK_ENVIOS: Envio[] = [
  // Envíos recientes (últimos 7 días)
  {
    id: 1001,
    flujoId: 1,
    prospectoId: 1,
    fechaEnvio: '2025-11-18T10:00:00Z',
    estado: 'enviado',
    canal: 'email',
    ofertaUtilizada: 1,
    mensaje: 'Contacto inicial - Te enviamos una oferta especial',
    tasaApertura: 45,
    clicks: 12,
  },
  {
    id: 1002,
    flujoId: 1,
    prospectoId: 2,
    fechaEnvio: '2025-11-18T10:15:00Z',
    estado: 'enviado',
    canal: 'email',
    ofertaUtilizada: 1,
    mensaje: 'Contacto inicial - Te enviamos una oferta especial',
    tasaApertura: 52,
    clicks: 8,
  },
  {
    id: 1003,
    flujoId: 2,
    prospectoId: 3,
    fechaEnvio: '2025-11-18T11:00:00Z',
    estado: 'aceptado',
    canal: 'email',
    ofertaUtilizada: 3,
    mensaje: 'Propuesta de reestructuración de deuda',
    tasaApertura: 100,
    clicks: 25,
  },
  {
    id: 1004,
    flujoId: 1,
    prospectoId: 4,
    fechaEnvio: '2025-11-17T14:30:00Z',
    estado: 'fallido',
    canal: 'sms',
    ofertaUtilizada: 2,
    mensaje: 'Recordatorio: Tu oferta especial vence pronto',
  },
  {
    id: 1005,
    flujoId: 3,
    prospectoId: 5,
    fechaEnvio: '2025-11-17T09:00:00Z',
    estado: 'enviado',
    canal: 'email',
    ofertaUtilizada: 5,
    mensaje: 'Oferta especial para resolución de deuda',
    tasaApertura: 78,
    clicks: 18,
  },

  // Envíos de la semana pasada
  {
    id: 1006,
    flujoId: 4,
    prospectoId: 6,
    fechaEnvio: '2025-11-15T08:00:00Z',
    estado: 'abierto',
    canal: 'email',
    ofertaUtilizada: 6,
    mensaje: 'Bienvenida - Descubre nuestras soluciones',
    tasaApertura: 35,
    clicks: 5,
  },
  {
    id: 1007,
    flujoId: 1,
    prospectoId: 7,
    fechaEnvio: '2025-11-14T10:00:00Z',
    estado: 'enviado',
    canal: 'sms',
    ofertaUtilizada: 2,
    mensaje: 'Recordatorio: Tu oferta especial vence pronto',
  },
  {
    id: 1008,
    flujoId: 2,
    prospectoId: 8,
    fechaEnvio: '2025-11-13T15:00:00Z',
    estado: 'aceptado',
    canal: 'email',
    ofertaUtilizada: 4,
    mensaje: 'Confirmación de interés en nuestro plan',
    tasaApertura: 100,
    clicks: 32,
  },
  {
    id: 1009,
    flujoId: 1,
    prospectoId: 9,
    fechaEnvio: '2025-11-12T11:00:00Z',
    estado: 'enviado',
    canal: 'email',
    ofertaUtilizada: 1,
    mensaje: 'Contacto inicial - Te enviamos una oferta especial',
    tasaApertura: 62,
    clicks: 14,
  },
  {
    id: 1010,
    flujoId: 3,
    prospectoId: 10,
    fechaEnvio: '2025-11-11T09:30:00Z',
    estado: 'aceptado',
    canal: 'sms',
    ofertaUtilizada: 5,
    mensaje: 'Oferta especial para resolución de deuda',
  },

  // Envíos más antiguos (para histórico)
  {
    id: 1011,
    flujoId: 1,
    prospectoId: 11,
    fechaEnvio: '2025-11-08T10:00:00Z',
    estado: 'enviado',
    canal: 'email',
    ofertaUtilizada: 1,
    mensaje: 'Contacto inicial - Te enviamos una oferta especial',
    tasaApertura: 48,
    clicks: 10,
  },
  {
    id: 1012,
    flujoId: 2,
    prospectoId: 12,
    fechaEnvio: '2025-11-05T14:00:00Z',
    estado: 'aceptado',
    canal: 'email',
    ofertaUtilizada: 3,
    mensaje: 'Propuesta de reestructuración de deuda',
    tasaApertura: 100,
    clicks: 28,
  },
  {
    id: 1013,
    flujoId: 1,
    prospectoId: 13,
    fechaEnvio: '2025-11-01T08:00:00Z',
    estado: 'enviado',
    canal: 'sms',
    ofertaUtilizada: 2,
    mensaje: 'Recordatorio: Tu oferta especial vence pronto',
  },
]

export const ENVIO_STATS = {
  totalEnvios: MOCK_ENVIOS.length,
  enviosExitosos: MOCK_ENVIOS.filter((e) => e.estado === 'enviado' || e.estado === 'abierto').length,
  enviosFallidos: MOCK_ENVIOS.filter((e) => e.estado === 'fallido').length,
  enviosAceptados: MOCK_ENVIOS.filter((e) => e.estado === 'aceptado').length,
  tasaEntregaPromedio:
    (MOCK_ENVIOS.filter((e) => e.estado !== 'fallido').length / MOCK_ENVIOS.length) * 100,
  tasaAceptacionPromedio: (
    MOCK_ENVIOS.filter((e) => e.estado === 'aceptado').length / MOCK_ENVIOS.length
  ) * 100,
}
