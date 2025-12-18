/**
 * Hook for fetching detailed information about a single Envio
 *
 * Handles:
 * - Fetching envio details by ID
 * - Loading states and error handling
 * - Automatic refetching when ID changes
 */

import { useQuery } from '@tanstack/react-query'
import type { Envio } from '@/types/envios'
import { enviosService } from '@/api/envios.service'

/**
 * Hook to fetch complete details of a single shipment
 *
 * @param envioId - ID of the shipment to fetch (null to skip fetching)
 * @returns Query result with envio details
 *
 * @example
 * const { data: envio, isLoading, error } = useEnvioDetail(123)
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 *
 * return (
 *   <div>
 *     <p>To: {envio.metadata.destinatario}</p>
 *     <p>Status: {envio.estado}</p>
 *     {envio.estado === 'fallido' && (
 *       <p>Error: {envio.metadata.error}</p>
 *     )}
 *   </div>
 * )
 */
export function useEnvioDetail(envioId: number | null) {
  return useQuery({
    queryKey: ['envios', 'detail', envioId],
    queryFn: () => {
      if (!envioId) {
        throw new Error('Envio ID is required')
      }
      return enviosService.getDetail(envioId)
    },
    enabled: !!envioId, // Only fetch if envioId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if an envio is in a pending/processing state
 *
 * Useful for showing "still sending" messages or refresh buttons
 *
 * @param envio - The envio object to check
 * @returns boolean indicating if envio is still being processed
 *
 * @example
 * const isPending = useEnvioIsPending(envio)
 * return isPending ? <Spinner /> : <CheckIcon />
 */
export function useEnvioIsPending(envio: Envio | undefined): boolean {
  return envio?.estado === 'pendiente'
}

/**
 * Hook to check if an envio failed
 *
 * @param envio - The envio object to check
 * @returns boolean indicating if envio failed
 *
 * @example
 * const isFailed = useEnvioIsFailed(envio)
 * return isFailed ? <ErrorBox error={envio.metadata.error} /> : null
 */
export function useEnvioIsFailed(envio: Envio | undefined): boolean {
  return envio?.estado === 'fallido'
}

/**
 * Hook to get the error message from a failed envio
 *
 * @param envio - The envio object
 * @returns Error message string or null
 *
 * @example
 * const error = useEnvioErrorMessage(envio)
 * return error ? <ErrorAlert message={error} /> : null
 */
export function useEnvioErrorMessage(envio: Envio | undefined): string | null {
  return envio?.estado === 'fallido' && envio.metadata.error ? envio.metadata.error : null
}

/**
 * Hook to get formatted display name for the recipient
 *
 * Handles both email and SMS formats
 *
 * @param envio - The envio object
 * @returns Formatted recipient name (email or phone)
 *
 * @example
 * const recipientName = useEnvioRecipient(envio)
 * return <p>Sent to: {recipientName}</p>
 */
export function useEnvioRecipient(envio: Envio | undefined): string {
  if (!envio) return '-'

  const destinatario = envio.metadata.destinatario || '-'

  if (envio.canal === 'sms') {
    // Format phone number
    return destinatario.replace(/(\d)(?=(\d{4})+(?!\d))/g, '$1 ')
  }

  // Return email as-is
  return destinatario
}

/**
 * Hook to get formatted display status for UI
 *
 * @param envio - The envio object
 * @returns Human-readable status string
 *
 * @example
 * const status = useEnvioStatus(envio)
 * return <Badge>{status}</Badge>
 */
export function useEnvioStatus(envio: Envio | undefined): string {
  if (!envio) return '-'

  switch (envio.estado) {
    case 'pendiente':
      return 'Pendiente'
    case 'enviado':
      return 'Enviado'
    case 'fallido':
      return 'Fallido'
    default:
      return envio.estado
  }
}

/**
 * Hook to get formatted display canal for UI
 *
 * @param envio - The envio object
 * @returns Human-readable canal string with icon hint
 *
 * @example
 * const canal = useEnvioCanal(envio)
 * return <span>{canal}</span> // "📧 Email" or "📱 SMS"
 */
export function useEnvioCanal(envio: Envio | undefined): string {
  if (!envio) return '-'

  switch (envio.canal) {
    case 'email':
      return '📧 Email'
    case 'sms':
      return '📱 SMS'
    default:
      return envio.canal
  }
}
