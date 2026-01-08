/**
 * Funciones de validacion para el Excel de prospectos
 */

// =============================================================================
// VALIDADORES
// =============================================================================

/**
 * Valida RUT chileno: formato XXXXXXXX-K o XXXXXXXX (7-9 digitos + K opcional)
 */
export function validateRUT(rut: string): boolean {
  if (!rut) return false
  const cleanRut = rut.toString().toUpperCase().replace(/[.-]/g, '')
  return /^\d{7,9}[K]?$/.test(cleanRut)
}

/**
 * Valida email basico
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  return /\S+@\S+\.\S+/.test(email)
}

// =============================================================================
// TIPOS DE RESULTADO
// =============================================================================

export interface RowValidationResult {
  error: string | null
  warnings: string[]
}

// =============================================================================
// VALIDACION DE FILA
// =============================================================================

/**
 * Valida una fila del Excel
 * Retorna errores criticos (que evitan cargar la fila) y advertencias (que permiten cargar)
 */
export function validateRow(row: Record<string, unknown>, rowNumber: number): RowValidationResult {
  const warnings: string[] = []

  // ERROR CRITICO: Falta el nombre (es el unico campo realmente obligatorio)
  if (!row.nombre || row.nombre.toString().trim() === '') {
    return {
      error: `Fila ${rowNumber}: Falta nombre`,
      warnings: [],
    }
  }

  // ADVERTENCIA: RUT invalido o incompleto
  if (!row.rut || !validateRUT(String(row.rut))) {
    warnings.push(`Fila ${rowNumber}: RUT invalido o incompleto (${row.rut || 'vacio'})`)
  }

  // ADVERTENCIA: Email invalido o vacio
  if (!row.email || !validateEmail(String(row.email))) {
    warnings.push(`Fila ${rowNumber}: Email invalido o vacio (${row.email || 'vacio'})`)
  }

  // ADVERTENCIA: Telefono vacio
  if (!row.telefono || row.telefono.toString().trim() === '') {
    warnings.push(`Fila ${rowNumber}: Telefono vacio`)
  }

  // ERROR CRITICO: Monto de deuda invalido
  const montoDeuda = parseFloat(row.monto_deuda?.toString() ?? '')
  if (isNaN(montoDeuda) || montoDeuda < 0) {
    return {
      error: `Fila ${rowNumber}: Monto de deuda invalido (${row.monto_deuda}). Debe ser un numero valido`,
      warnings,
    }
  }

  return {
    error: null,
    warnings,
  }
}
