/**
 * Funciones de validación para plantillas SMS y Email
 * Principio de Responsabilidad Única: solo validar
 */

import type { PlantillaSMS, PlantillaEmail, ValidacionPlantilla } from '@/types/plantilla'

/**
 * Máximo de caracteres para SMS (GSM 7-bit estándar)
 * Algunos caracteres especiales cuentan como 2 caracteres
 */
const SMS_MAX_CHARS = 160
const SMS_WARNING_THRESHOLD = 140 // Advertencia a partir de aquí

/**
 * Caracteres que cuentan como 2 en SMS
 */
const CARACTERES_DOBLES = ['€', '[', ']', '{', '}', '\\', '^', '~', '|']

/**
 * Calcula la longitud real de un SMS considerando caracteres especiales
 */
export function calcularLongitudSMS(texto: string): number {
  let longitud = 0

  for (const char of texto) {
    if (CARACTERES_DOBLES.includes(char)) {
      longitud += 2
    } else {
      longitud += 1
    }
  }

  return longitud
}

/**
 * Valida una plantilla SMS
 */
export function validarPlantillaSMS(plantilla: Omit<PlantillaSMS, 'id'>): ValidacionPlantilla {
  const errores: string[] = []
  const advertencias: string[] = []

  // Validar nombre
  if (!plantilla.nombre?.trim()) {
    errores.push('El nombre de la plantilla es obligatorio')
  }

  if (plantilla.nombre && plantilla.nombre.length > 100) {
    errores.push('El nombre no puede exceder 100 caracteres')
  }

  // Validar contenido
  if (!plantilla.contenido?.trim()) {
    errores.push('El contenido del SMS es obligatorio')
  }

  const longitudSMS = calcularLongitudSMS(plantilla.contenido)

  if (longitudSMS > SMS_MAX_CHARS) {
    errores.push(`El SMS contiene ${longitudSMS} caracteres. Máximo permitido: ${SMS_MAX_CHARS}`)
  }

  if (longitudSMS > SMS_WARNING_THRESHOLD) {
    advertencias.push(
      `El SMS contiene ${longitudSMS} caracteres. Se recomienda mantenerlo bajo ${SMS_WARNING_THRESHOLD}`
    )
  }

  // Validar descripción
  if (plantilla.descripcion && plantilla.descripcion.length > 500) {
    errores.push('La descripción no puede exceder 500 caracteres')
  }

  return {
    esValida: errores.length === 0,
    errores,
    advertencias,
  }
}

/**
 * Valida una plantilla Email
 */
export function validarPlantillaEmail(plantilla: Omit<PlantillaEmail, 'id'>): ValidacionPlantilla {
  const errores: string[] = []
  const advertencias: string[] = []

  // Validar nombre
  if (!plantilla.nombre?.trim()) {
    errores.push('El nombre de la plantilla es obligatorio')
  }

  if (plantilla.nombre && plantilla.nombre.length > 100) {
    errores.push('El nombre no puede exceder 100 caracteres')
  }

  // Validar asunto
  if (!plantilla.asunto?.trim()) {
    errores.push('El asunto del email es obligatorio')
  }

  if (plantilla.asunto && plantilla.asunto.length > 200) {
    errores.push('El asunto no puede exceder 200 caracteres')
  }

  // Validar componentes
  if (!plantilla.componentes || plantilla.componentes.length === 0) {
    errores.push('La plantilla debe contener al menos un componente')
  }

  // Validar cada componente
  plantilla.componentes?.forEach((componente, index) => {
    switch (componente.tipo) {
      case 'logo':
        if (!componente.contenido?.url) {
          errores.push(`Logo (componente ${index + 1}): URL es obligatoria`)
        }
        if (componente.contenido?.url && !isValidUrl(componente.contenido.url)) {
          errores.push(`Logo (componente ${index + 1}): URL no es válida`)
        }
        break

      case 'texto':
        if (!componente.contenido?.texto?.trim()) {
          errores.push(`Texto (componente ${index + 1}): Contenido es obligatorio`)
        }
        break

      case 'boton':
        if (!componente.contenido?.texto?.trim()) {
          errores.push(`Botón (componente ${index + 1}): Texto es obligatorio`)
        }
        if (!componente.contenido?.url) {
          errores.push(`Botón (componente ${index + 1}): URL es obligatoria`)
        }
        if (componente.contenido?.url && !isValidUrl(componente.contenido.url)) {
          errores.push(`Botón (componente ${index + 1}): URL no es válida`)
        }
        break

      case 'footer':
        if (!componente.contenido?.texto?.trim()) {
          advertencias.push(`Footer (componente ${index + 1}): Considera agregar texto`)
        }
        break
    }
  })

  // Validar descripción
  if (plantilla.descripcion && plantilla.descripcion.length > 500) {
    errores.push('La descripción no puede exceder 500 caracteres')
  }

  return {
    esValida: errores.length === 0,
    errores,
    advertencias,
  }
}

/**
 * Valida una URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url, 'https://example.com')
    return true
  } catch {
    return false
  }
}

/**
 * Genera un preview de texto para SMS
 */
export function generarPreviewSMS(contenido: string): string {
  const maxPreview = 100
  if (contenido.length > maxPreview) {
    return `${contenido.substring(0, maxPreview)}...`
  }
  return contenido
}

/**
 * Obtiene información de caracteres para SMS
 */
export function obtenerInfoCaracteresSMS(contenido: string) {
  const longitud = calcularLongitudSMS(contenido)
  const disponibles = SMS_MAX_CHARS - longitud
  const porcentajeUso = (longitud / SMS_MAX_CHARS) * 100

  return {
    longitudActual: longitud,
    disponibles: Math.max(0, disponibles),
    porcentajeUso,
    esValido: longitud <= SMS_MAX_CHARS,
  }
}
