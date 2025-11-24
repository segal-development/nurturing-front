/**
 * Categoriza un monto de deuda en categorías predefinidas
 * Usado para mostrar badges de tipo en la tabla
 */

export function getMontoCategoryKey(monto: number): string {
  if (monto === 0) return 'cero'
  if (monto <= 500000) return 'baja'
  if (monto <= 2000000) return 'media'
  return 'alta'
}
