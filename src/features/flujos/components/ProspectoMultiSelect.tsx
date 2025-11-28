/**
 * Multi-select component for choosing prospects
 * Used in flow execution modals
 */

import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'

interface ProspectoMultiSelectProps {
  origenId?: number | string
  value: number[]
  onChange: (ids: number[]) => void
}

interface Prospecto {
  id: number
  nombre: string
  email?: string
  telefono?: string
}

export function ProspectoMultiSelect({
  origenId,
  value,
  onChange,
}: ProspectoMultiSelectProps) {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [filteredProspectos, setFilteredProspectos] = useState<Prospecto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!origenId) return

    const loadProspectos = async () => {
      setIsLoading(true)
      try {
        // For now, show empty list - backend can implement API endpoint
        // This component can be updated when prospects API is ready
        setProspectos([])
        setFilteredProspectos([])
      } catch (error) {
        console.error('Error loading prospectos:', error)
        setProspectos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProspectos()
  }, [origenId])

  // Filter prospectos based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProspectos(prospectos)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = prospectos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.telefono?.includes(term)
    )
    setFilteredProspectos(filtered)
  }, [searchTerm, prospectos])

  const handleToggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const handleSelectAll = () => {
    if (value.length === filteredProspectos.length) {
      onChange([])
    } else {
      onChange(filteredProspectos.map((p) => p.id))
    }
  }

  const selectedCount = value.length

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-segal-blue/60" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-2 border border-segal-blue/30 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
        />
      </div>

      {/* Selected count and select all button */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-segal-dark/60">{selectedCount} seleccionado(s)</span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-segal-blue hover:text-segal-blue/80 font-medium"
        >
          {value.length === filteredProspectos.length && filteredProspectos.length > 0
            ? 'Deseleccionar todo'
            : 'Seleccionar todo'}
        </button>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 right-0 border border-segal-blue/30 rounded bg-white shadow-lg">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-segal-blue" />
              </div>
            ) : filteredProspectos.length === 0 ? (
              <div className="p-4 text-center text-sm text-segal-dark/60">
                {prospectos.length === 0
                  ? 'No hay prospectos disponibles'
                  : 'No se encontraron resultados'}
              </div>
            ) : (
              <div className="h-[300px] overflow-y-auto">
                <div className="space-y-1 p-2">
                  {filteredProspectos.map((prospecto) => (
                    <label
                      key={prospecto.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-segal-blue/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(prospecto.id)}
                        onChange={() => handleToggle(prospecto.id)}
                        className="h-4 w-4 rounded border-segal-blue/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-segal-dark truncate">
                          {prospecto.nombre}
                        </p>
                        {prospecto.email && (
                          <p className="text-xs text-segal-dark/60 truncate">{prospecto.email}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Show selected items in a compact way */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {prospectos
            .filter((p) => value.includes(p.id))
            .slice(0, 3)
            .map((p) => (
              <span key={p.id} className="inline-block text-xs bg-segal-green/10 text-segal-green px-2 py-1 rounded">
                {p.nombre}
              </span>
            ))}
          {selectedCount > 3 && (
            <span className="inline-block text-xs bg-segal-blue/10 text-segal-blue px-2 py-1 rounded">
              +{selectedCount - 3} más
            </span>
          )}
        </div>
      )}
    </div>
  )
}
