/**
 * Utilidades para formatear fechas del backend Laravel (formato chileno dd/mm/YYYY HH:mm:ss)
 */

export function parseChileanDate(dateString: string): Date {
  if (!dateString) return new Date()
  
  // Formato: "20/11/2025 09:55:37"
  const [datePart, timePart] = dateString.split(' ')
  const [day, month, year] = datePart.split('/')
  const [hours, minutes, seconds] = timePart?.split(':') || ['00', '00', '00']
  
  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`)
}

export function formatChileanDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = parseChileanDate(date)
  }
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}
