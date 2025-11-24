/**
 * Mock data para ofertas Infocom
 * Contiene ofertas con diferentes tasas de aceptación y activación
 */

import type { OfertaInfocom } from '@/types/oferta'

// Tipo extendido con métricas adicionales para analytics
export interface OfertaConMetricas extends OfertaInfocom {
  tasaAceptacion?: number
  tasaConversion?: number
  impresiones?: number
  clicks?: number
}

export const MOCK_OFERTAS: OfertaConMetricas[] = [
  {
    id: 1,
    titulo: 'Descuento 10%',
    descripcion: 'Descuento del 10% en nuestros servicios',
    descuento: '10',
    fecha_inicio: '2025-11-01T00:00:00Z',
    fecha_fin: '2025-11-30T23:59:59Z',
    activo: true,
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-18T15:00:00Z',
    tasaAceptacion: 45.2,
    tasaConversion: 12.3,
    impresiones: 450,
    clicks: 145,
  },
  {
    id: 2,
    titulo: 'Promoción Especial',
    descripcion: 'Promoción especial por tiempo limitado',
    descuento: '15',
    fecha_inicio: '2025-11-05T00:00:00Z',
    fecha_fin: '2025-11-25T23:59:59Z',
    activo: true,
    created_at: '2025-11-05T11:00:00Z',
    updated_at: '2025-11-18T14:00:00Z',
    tasaAceptacion: 38.5,
    tasaConversion: 8.7,
    impresiones: 380,
    clicks: 92,
  },
  {
    id: 3,
    titulo: 'Plan de Pago Flexible',
    descripcion: 'Reestructuración de deuda con plan flexible',
    descuento: '0',
    fecha_inicio: '2025-10-15T00:00:00Z',
    fecha_fin: '2025-12-31T23:59:59Z',
    activo: true,
    created_at: '2025-10-15T08:00:00Z',
    updated_at: '2025-11-18T13:00:00Z',
    tasaAceptacion: 62.1,
    tasaConversion: 18.9,
    impresiones: 280,
    clicks: 145,
  },
  {
    id: 4,
    titulo: 'Bonificación por Pago Anticipado',
    descripcion: 'Bonificación adicional si pagas anticipadamente',
    descuento: '20',
    fecha_inicio: '2025-10-20T00:00:00Z',
    fecha_fin: '2025-12-20T23:59:59Z',
    activo: true,
    created_at: '2025-10-20T09:00:00Z',
    updated_at: '2025-11-18T12:00:00Z',
    tasaAceptacion: 51.3,
    tasaConversion: 14.2,
    impresiones: 220,
    clicks: 78,
  },
  {
    id: 5,
    titulo: 'Condonación Parcial',
    descripcion: 'Condonación de hasta el 25% de la deuda',
    descuento: '25',
    fecha_inicio: '2025-10-01T00:00:00Z',
    fecha_fin: '2025-12-31T23:59:59Z',
    activo: true,
    created_at: '2025-10-01T09:00:00Z',
    updated_at: '2025-11-18T11:00:00Z',
    tasaAceptacion: 78.4,
    tasaConversion: 31.2,
    impresiones: 150,
    clicks: 89,
  },
  {
    id: 6,
    titulo: 'Bienvenida 15% OFF',
    descripcion: 'Descuento de bienvenida para nuevos prospectos',
    descuento: '15',
    fecha_inicio: '2025-11-10T00:00:00Z',
    fecha_fin: '2025-12-10T23:59:59Z',
    activo: true,
    created_at: '2025-11-10T14:00:00Z',
    updated_at: '2025-11-18T10:00:00Z',
    tasaAceptacion: 35.7,
    tasaConversion: 9.1,
    impresiones: 320,
    clicks: 65,
  },
  {
    id: 7,
    titulo: 'Bundle Especial',
    descripcion: 'Paquete de servicios con descuento combinado',
    descuento: '30',
    fecha_inicio: '2025-11-15T00:00:00Z',
    fecha_fin: '2025-12-15T23:59:59Z',
    activo: false,
    created_at: '2025-11-15T16:00:00Z',
    updated_at: '2025-11-18T09:00:00Z',
    tasaAceptacion: 0,
    tasaConversion: 0,
    impresiones: 0,
    clicks: 0,
  },
]

export const OFERTA_STATS = {
  totalOfertas: MOCK_OFERTAS.length,
  ofertasActivas: MOCK_OFERTAS.filter((o) => o.activo).length,
  tasaAceptacionPromedio:
    MOCK_OFERTAS.filter((o) => o.activo).reduce((sum, o) => sum + (o.tasaAceptacion ?? 0), 0) /
    MOCK_OFERTAS.filter((o) => o.activo).length,
  impresionesTotales: MOCK_OFERTAS.reduce((sum, o) => sum + (o.impresiones ?? 0), 0),
  clicksTotales: MOCK_OFERTAS.reduce((sum, o) => sum + (o.clicks ?? 0), 0),
}
