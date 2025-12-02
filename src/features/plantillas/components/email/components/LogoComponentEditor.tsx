/**
 * Editor del componente Logo
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { LogoComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

interface LogoComponentEditorProps {
  componente: LogoComponentFormData
  onUpdate: (componente: LogoComponentFormData) => void
}

export function LogoComponentEditor({
  componente,
  onUpdate,
}: LogoComponentEditorProps) {
  return (
    <div className="space-y-4">
      {/* URL */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          URL del Logo <span className="text-segal-red">*</span>
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
          placeholder="https://ejemplo.com/logo.png"
          className="border-segal-blue/30"
        />
      </div>

      {/* Alt text */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto alternativo
        </Label>
        <Input
          type="text"
          value={componente.contenido.alt || ''}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...componente.contenido,
                alt: e.target.value,
              },
            })
          }
          placeholder="Logo de la empresa"
          className="border-segal-blue/30"
        />
      </div>

      {/* Dimensiones */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Ancho (px)
          </Label>
          <Input
            type="number"
            min="50"
            max="500"
            value={componente.contenido.ancho || 200}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...componente.contenido,
                  ancho: parseInt(e.target.value) || 200,
                },
              })
            }
            className="border-segal-blue/30"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Alto (px)
          </Label>
          <Input
            type="number"
            min="50"
            max="500"
            value={componente.contenido.altura || 100}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...componente.contenido,
                  altura: parseInt(e.target.value) || 100,
                },
              })
            }
            className="border-segal-blue/30"
          />
        </div>
      </div>

      {/* Preview */}
      {componente.contenido.url && (
        <div className="border-t border-segal-blue/10 pt-4">
          <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
          <div className="bg-segal-blue/5 rounded p-4 flex justify-center">
            <img
              src={componente.contenido.url}
              alt={componente.contenido.alt || 'Logo'}
              style={{
                maxWidth: `${componente.contenido.ancho || 200}px`,
                maxHeight: `${componente.contenido.altura || 100}px`,
              }}
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
