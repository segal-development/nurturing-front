/**
 * Editor del componente Botón
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { BotonComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

interface BotonComponentEditorProps {
  componente: BotonComponentFormData
  onUpdate: (componente: BotonComponentFormData) => void
}

export function BotonComponentEditor({
  componente,
  onUpdate,
}: BotonComponentEditorProps) {
  return (
    <div className="space-y-4">
      {/* Texto */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto del botón <span className="text-segal-red">*</span>
        </Label>
        <Input
          type="text"
          value={componente.contenido.texto || ''}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...componente.contenido,
                texto: e.target.value,
              },
            })
          }
          placeholder="Haz clic aquí"
          className="border-segal-blue/30"
        />
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          URL del botón <span className="text-segal-red">*</span>
        </Label>
        <Input
          type="url"
          value={componente.contenido.url || ''}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...componente.contenido,
                url: e.target.value,
              },
            })
          }
          placeholder="https://ejemplo.com"
          className="border-segal-blue/30"
        />
      </div>

      {/* Colores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Color de fondo
          </Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={componente.contenido.color_fondo || '#1e3a8a'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...componente.contenido,
                    color_fondo: e.target.value,
                  },
                })
              }
              className="h-10 rounded border border-segal-blue/30 cursor-pointer"
            />
            <Input
              type="text"
              value={componente.contenido.color_fondo || '#1e3a8a'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...componente.contenido,
                    color_fondo: e.target.value,
                  },
                })
              }
              className="border-segal-blue/30 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Color de texto
          </Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={componente.contenido.color_texto || '#ffffff'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...componente.contenido,
                    color_texto: e.target.value,
                  },
                })
              }
              className="h-10 rounded border border-segal-blue/30 cursor-pointer"
            />
            <Input
              type="text"
              value={componente.contenido.color_texto || '#ffffff'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...componente.contenido,
                    color_texto: e.target.value,
                  },
                })
              }
              className="border-segal-blue/30 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-segal-blue/10 pt-4">
        <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
        <div className="bg-segal-blue/5 rounded p-4 flex justify-center border border-segal-blue/10">
          <button
            style={{
              backgroundColor: componente.contenido.color_fondo || '#1e3a8a',
              color: componente.contenido.color_texto || '#ffffff',
            }}
            className="px-6 py-2 rounded font-medium transition-opacity hover:opacity-80"
            disabled
          >
            {componente.contenido.texto || 'Botón'}
          </button>
        </div>
      </div>
    </div>
  )
}
