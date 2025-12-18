/**
 * Editor del componente Logo
 */

import { AlertTriangle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { LogoComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

/**
 * Detecta si una URL es un archivo SVG
 */
function isSvgUrl(url: string): boolean {
  if (!url) return false
  const lowercaseUrl = url.toLowerCase()
  return lowercaseUrl.endsWith('.svg') || lowercaseUrl.includes('.svg?')
}

interface LogoComponentEditorProps {
  componente: LogoComponentFormData
  onUpdate: (componente: LogoComponentFormData) => void
}

export function LogoComponentEditor({
  componente,
  onUpdate,
}: LogoComponentEditorProps) {
  // Valores por defecto para evitar undefined
  const contenido = componente.contenido || {
    url: '',
    alt: '',
    ancho: 200,
    altura: 100,
    color_fondo: undefined,
    padding: 20,
  }

  return (
    <div className="space-y-4">
      {/* URL */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          URL del Logo <span className="text-segal-red">*</span>
        </Label>
        <Input
          type="url"
          value={contenido.url || ''}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...contenido,
                url: e.target.value,
              },
            })
          }
          placeholder="https://ejemplo.com/logo.png"
          className="border-segal-blue/30"
        />
        {/* Warning para SVG */}
        {isSvgUrl(contenido.url || '') && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold">Advertencia: Archivo SVG detectado</p>
              <p className="mt-1">
                Gmail y otros clientes de email bloquean imágenes SVG por seguridad. 
                Recomendamos usar formatos <strong>PNG</strong> o <strong>JPG</strong> para asegurar 
                que el logo se muestre correctamente en todos los clientes de email.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alt text */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto alternativo
        </Label>
        <Input
          type="text"
          value={contenido.alt || ''}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...contenido,
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
            value={contenido.ancho || 200}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...contenido,
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
            value={contenido.altura || 100}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...contenido,
                  altura: parseInt(e.target.value) || 100,
                },
              })
            }
            className="border-segal-blue/30"
          />
        </div>
      </div>

      {/* Color de fondo */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Color de fondo (opcional)
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="logo-usar-fondo"
            checked={!!contenido.color_fondo}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...contenido,
                  color_fondo: e.target.checked ? '#1e3a8a' : undefined,
                },
              })
            }
            className="w-4 h-4 rounded border-segal-blue/30"
          />
          <Label htmlFor="logo-usar-fondo" className="text-sm text-segal-dark cursor-pointer">
            Usar color de fondo
          </Label>
        </div>
        {contenido.color_fondo && (
          <div className="flex gap-2">
            <Input
              type="color"
              value={contenido.color_fondo}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    color_fondo: e.target.value,
                  },
                })
              }
              className="w-14 h-10 p-1 border-segal-blue/30 cursor-pointer"
            />
            <Input
              type="text"
              value={contenido.color_fondo}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    color_fondo: e.target.value,
                  },
                })
              }
              placeholder="#1e3a8a"
              className="flex-1 border-segal-blue/30"
            />
          </div>
        )}
        <p className="text-xs text-segal-dark/60">
          Útil para logos claros que necesitan un fondo oscuro
        </p>
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Espaciado interno (px)
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={contenido.padding ?? 20}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...contenido,
                padding: parseInt(e.target.value) || 0,
              },
            })
          }
          className="border-segal-blue/30"
        />
      </div>

      {/* Preview */}
      {contenido.url && (
        <div className="border-t border-segal-blue/10 pt-4">
          <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
          <div 
            className="rounded flex justify-center border border-dashed border-segal-blue/20"
            style={{
              backgroundColor: contenido.color_fondo || 'transparent',
              padding: `${contenido.padding ?? 20}px`,
            }}
          >
            <img
              src={contenido.url}
              alt={contenido.alt || 'Logo'}
              style={{
                maxWidth: `${contenido.ancho || 200}px`,
                maxHeight: `${contenido.altura || 100}px`,
              }}
              className="object-contain"
            />
          </div>
          {!contenido.color_fondo && (
            <p className="text-xs text-segal-dark/40 mt-1 italic">Sin fondo (transparente)</p>
          )}
        </div>
      )}
    </div>
  )
}
