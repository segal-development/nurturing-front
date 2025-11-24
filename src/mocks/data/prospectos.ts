/**
 * Mock data para prospectos - MIGRADO AL BACKEND LARAVEL 12
 * Mantenido para testing local sin conexión
 */

import type { Prospecto } from '@/types/prospecto'

const NOMBRES = [
  'Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana López', 'Pedro García',
  'Laura Martínez', 'Diego Sánchez', 'Sofia Flores', 'Ricardo Morales', 'Elena Torres',
  'Javier Ruiz', 'Beatriz Castro', 'Fernando Reyes', 'Claudia Jiménez', 'Andrés Vargas',
  'Patricia Ramírez', 'Roberto Aguilar', 'Mariana Campos', 'Luis Domínguez', 'Carolina Vega',
  'Miguel Ángel Ponce', 'Francisca Sepúlveda', 'Sergio Leyton', 'Verónica Tapia', 'Gonzalo Parra',
  'Roxana Espinoza', 'Víctor Arevalo', 'Daniela Rojas', 'Samuel Mora', 'Irene Bravo',
  'Ángel Pino', 'Javiera Soto', 'Claudio Fuentes', 'Lorena Salazar', 'Enrique Mendez',
  'Constanza Bustos', 'Ramón Acuña', 'Marcela Valdez', 'Arturo Olivares', 'Susana Alvarez',
]

// Mapeo de tipos de deuda a tipo_prospecto_id (del backend Laravel)
const TIPO_PROSPECTO_MAP: Record<string, number> = {
  'baja': 1,      // Deuda Baja
  'media': 2,     // Deuda Media
  'alta': 3,      // Deuda Alta
}

// Mapeo de montos de deuda (en pesos chilenos)
const MONTO_POR_TIPO = {
  'baja': 400000,      // 0 - 699,000
  'media': 1000000,    // 700,000 - 1,500,000
  'alta': 2500000,     // 1,500,001+
  'antiguos': 800000,  // Variable
  'no-contactados': 500000, // Variable
}

const TIPOS_DEUDA = Object.keys(MONTO_POR_TIPO) as Array<keyof typeof MONTO_POR_TIPO>
const ESTADOS = ['activo', 'inactivo', 'convertido'] as const

function generateEmail(nombre: string, index: number): string {
  const nameParts = nombre.toLowerCase().split(' ')
  return `${nameParts[0]}.${nameParts[nameParts.length - 1]}${index}@example.com`
}

function generatePhone(): string {
  const area = Math.floor(Math.random() * 9) + 1
  const exchange = Math.floor(Math.random() * 800) + 200
  const subscriber = Math.floor(Math.random() * 10000)
  return `+569${area}${exchange}${subscriber.toString().padStart(4, '0')}`
}

function generateDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

export const MOCK_PROSPECTOS: Prospecto[] = Array.from({ length: 150 }, (_, i) => {
  const index = i + 1
  const nombre = NOMBRES[i % NOMBRES.length]
  const tipoDeuda = TIPOS_DEUDA[Math.floor(i / 30) % TIPOS_DEUDA.length]
  const estado = ESTADOS[i % 3]
  const daysAgo = Math.floor(Math.random() * 120) + 1
  const tipo_prospecto_id = TIPO_PROSPECTO_MAP[tipoDeuda] || 1
  const monto_deuda = MONTO_POR_TIPO[tipoDeuda] || 500000

  return {
    id: index,
    nombre: `${nombre} ${index}`,
    email: generateEmail(nombre, index),
    telefono: generatePhone(),
    tipo_prospecto_id,
    tipo_prospecto: {
      id: tipo_prospecto_id,
      nombre: tipoDeuda === 'baja' ? 'Deuda Baja' : tipoDeuda === 'media' ? 'Deuda Media' : 'Deuda Alta',
    },
    estado,
    monto_deuda,
    fecha_ultimo_contacto: generateDate(Math.floor(daysAgo / 2)),
    origen: 'mock_data',
    importacion_id: null,
    metadata: null,
    created_at: generateDate(daysAgo),
    updated_at: generateDate(Math.floor(daysAgo / 2)),
  }
})

export const PROSPECTO_STATS = {
  total_prospectos: MOCK_PROSPECTOS.length,
  por_estado: {
    activo: MOCK_PROSPECTOS.filter((p) => p.estado === 'activo').length,
    inactivo: MOCK_PROSPECTOS.filter((p) => p.estado === 'inactivo').length,
    convertido: MOCK_PROSPECTOS.filter((p) => p.estado === 'convertido').length,
  },
  por_tipo: [
    {
      nombre: 'Deuda Baja',
      total: MOCK_PROSPECTOS.filter((p) => p.tipo_prospecto_id === 1).length,
    },
    {
      nombre: 'Deuda Media',
      total: MOCK_PROSPECTOS.filter((p) => p.tipo_prospecto_id === 2).length,
    },
    {
      nombre: 'Deuda Alta',
      total: MOCK_PROSPECTOS.filter((p) => p.tipo_prospecto_id === 3).length,
    },
  ],
  monto_total_deuda: MOCK_PROSPECTOS.reduce((sum, p) => sum + p.monto_deuda, 0),
}
