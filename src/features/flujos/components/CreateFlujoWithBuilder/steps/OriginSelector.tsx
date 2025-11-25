/**
 * Step 1: Origin Selection
 * Allows user to select which origin/source to use for prospects
 */

import { Button } from '@/components/ui/button'
import type { OpcionesFlujos } from '@/api/flujos.service'

interface OriginSelectorProps {
  opciones?: OpcionesFlujos
  onSelect: (originId: string) => void
  loading: boolean
  onClose: () => void
}

export function OriginSelector({
  opciones,
  onSelect,
  loading,
  onClose,
}: OriginSelectorProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 p-6 space-y-6">
        {/* Origin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opciones?.origenes?.map((origin) => (
            <button
              key={origin.id}
              onClick={() => onSelect(origin.id)}
              disabled={loading}
              className="p-6 rounded-lg border-2 border-segal-blue/20 bg-white hover:border-segal-blue/40 hover:shadow-md transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-segal-dark">{origin.nombre}</h3>
                  <p className="text-sm text-segal-dark/60 mt-1">
                    {origin.total_flujos} flujos existentes
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-segal-blue/10">
                  <span className="text-sm font-bold text-segal-blue">📊</span>
                </div>
              </div>
              <p className="text-xs text-segal-dark/50 mt-3">
                Click para seleccionar este origen
              </p>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!opciones?.origenes || opciones.origenes.length === 0 && (
          <div className="rounded-lg bg-segal-blue/5 border border-segal-blue/10 p-6 text-center">
            <p className="text-segal-dark/60">No hay orígenes disponibles</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-segal-blue/10 bg-white p-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-segal-blue/20 text-segal-blue hover:bg-segal-blue/5"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
