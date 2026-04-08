/**
 * Banner que se muestra cuando no hay conexión a internet
 * Se posiciona fijo en la parte superior de la pantalla
 */

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-medium">
          Sin conexión a internet — Los cambios no se guardarán hasta que vuelva la conexión
        </span>
      </div>
    </div>
  )
}
