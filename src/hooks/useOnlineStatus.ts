/**
 * Hook para detectar el estado de conexión a internet
 * Usa useSyncExternalStore para suscribirse a eventos online/offline del browser
 * 
 * @example
 * const isOnline = useOnlineStatus()
 * if (!isOnline) {
 *   return <OfflineBanner />
 * }
 */

import { useSyncExternalStore } from 'react'

/**
 * Suscribe a los eventos online/offline del browser
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

/**
 * Obtiene el estado actual de conexión
 */
function getSnapshot(): boolean {
  return navigator.onLine
}

/**
 * Snapshot para SSR (siempre asume online)
 */
function getServerSnapshot(): boolean {
  return true
}

/**
 * Hook que retorna true si hay conexión a internet, false si no
 * Se actualiza automáticamente cuando cambia el estado de conexión
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
