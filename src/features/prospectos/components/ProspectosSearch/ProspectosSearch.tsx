/**
 * Componente de búsqueda client-side de prospectos
 * Busca en nombre, email y teléfono
 */

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ProspectosSearchProps } from '../../types/prospectos'

export function ProspectosSearch({ value, onChange, disabled }: ProspectosSearchProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-segal-dark/40" />
      <Input
        placeholder="Buscar por nombre, email o teléfono..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-9 border-segal-blue/20 focus:border-segal-blue focus:ring-segal-blue/20 bg-white disabled:opacity-50"
      />
    </div>
  )
}
