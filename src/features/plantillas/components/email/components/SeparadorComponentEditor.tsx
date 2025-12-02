/**
 * Editor del componente Separador
 * Simple altura y color
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { SeparadorComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

interface SeparadorComponentEditorProps {
  componente: SeparadorComponentFormData
  onUpdate: (componente: SeparadorComponentFormData) => void
}

export function SeparadorComponentEditor({
  componente,
  onUpdate,
}: SeparadorComponentEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Altura */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Altura (px)
          </Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={componente.contenido.altura || 10}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...componente.contenido,
                  altura: parseInt(e.target.value) || 10,
                },
              })
            }
            className="border-segal-blue/30"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Color
          </Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={componente.contenido.color || '#e0e0e0'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...componente.contenido,
                    color: e.target.value,
                  },
                })
              }
              className="h-10 rounded border border-segal-blue/30 cursor-pointer"
            />
            <Input
              type="text"
              value={componente.contenido.color || '#e0e0e0'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...componente.contenido,
                    color: e.target.value,
                  },
                })
              }
              className="border-segal-blue/30 font-mono text-sm"
              placeholder="#e0e0e0"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-segal-blue/10 pt-4">
        <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
        <div
          style={{
            height: `${componente.contenido.altura || 10}px`,
            backgroundColor: componente.contenido.color || '#e0e0e0',
          }}
          className="rounded"
        />
      </div>
    </div>
  )
}
