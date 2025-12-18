/**
 * Editor del componente Imagen
 * Permite agregar imágenes con link opcional al email
 */

import { AlertTriangle, ExternalLink } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ImagenComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

/**
 * Detecta si una URL es un archivo SVG
 */
function isSvgUrl(url: string): boolean {
  if (!url) return false
  const lowercaseUrl = url.toLowerCase()
  return lowercaseUrl.endsWith('.svg') || lowercaseUrl.includes('.svg?')
}

interface ImagenComponentEditorProps {
  componente: ImagenComponentFormData
  onUpdate: (componente: ImagenComponentFormData) => void
}

export function ImagenComponentEditor({
  componente,
  onUpdate,
}: ImagenComponentEditorProps) {
  // Valores por defecto para evitar undefined
  const contenido = componente.contenido || {
    url: '',
    alt: '',
    ancho: undefined,
    altura: undefined,
    alineacion: 'center',
    link_url: '',
    link_target: '_blank',
    border_radius: 0,
    padding: 10,
  }

  const updateContenido = (updates: Partial<typeof contenido>) => {
    onUpdate({
      ...componente,
      contenido: {
        ...contenido,
        ...updates,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* URL de la imagen */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          URL de la Imagen <span className="text-segal-red">*</span>
        </Label>
        <Input
          type="url"
          value={contenido.url || ''}
          onChange={(e) => updateContenido({ url: e.target.value })}
          placeholder="https://ejemplo.com/imagen.png"
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
                que la imagen se muestre correctamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Texto alternativo */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto alternativo <span className="text-segal-red">*</span>
        </Label>
        <Input
          type="text"
          value={contenido.alt || ''}
          onChange={(e) => updateContenido({ alt: e.target.value })}
          placeholder="Descripción de la imagen"
          className="border-segal-blue/30"
          maxLength={200}
        />
        <p className="text-xs text-segal-dark/60">
          Texto que se muestra si la imagen no carga. Importante para accesibilidad.
        </p>
      </div>

      {/* Dimensiones */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Ancho (px) <span className="text-segal-dark/40 text-xs font-normal">opcional</span>
          </Label>
          <Input
            type="number"
            min="50"
            max="600"
            value={contenido.ancho || ''}
            onChange={(e) => updateContenido({ 
              ancho: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="Automático"
            className="border-segal-blue/30"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Alto (px) <span className="text-segal-dark/40 text-xs font-normal">opcional</span>
          </Label>
          <Input
            type="number"
            min="50"
            max="800"
            value={contenido.altura || ''}
            onChange={(e) => updateContenido({ 
              altura: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="Automático"
            className="border-segal-blue/30"
          />
        </div>
      </div>
      <p className="text-xs text-segal-dark/60 -mt-2">
        Dejá vacío para usar dimensiones automáticas (respeta el ancho máximo de 600px del email).
      </p>

      {/* Alineación */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Alineación
        </Label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => updateContenido({ alineacion: align })}
              className={`flex-1 px-3 py-2 rounded border text-sm transition-colors ${
                contenido.alineacion === align
                  ? 'bg-segal-blue text-white border-segal-blue'
                  : 'border-segal-blue/30 text-segal-dark hover:border-segal-blue/50'
              }`}
            >
              {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
            </button>
          ))}
        </div>
      </div>

      {/* Link opcional */}
      <div className="space-y-2 border-t border-segal-blue/10 pt-4">
        <Label className="text-sm font-semibold text-segal-dark flex items-center gap-1">
          <ExternalLink className="h-4 w-4" />
          Link (opcional)
        </Label>
        <Input
          type="url"
          value={contenido.link_url || ''}
          onChange={(e) => updateContenido({ link_url: e.target.value })}
          placeholder="https://ejemplo.com/pagina"
          className="border-segal-blue/30"
        />
        <p className="text-xs text-segal-dark/60">
          Si agregás un link, al hacer clic en la imagen se abrirá esta URL.
        </p>

        {contenido.link_url && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="imagen-link-target"
              checked={contenido.link_target === '_blank'}
              onChange={(e) => updateContenido({ 
                link_target: e.target.checked ? '_blank' : '_self' 
              })}
              className="w-4 h-4 rounded border-segal-blue/30"
            />
            <Label htmlFor="imagen-link-target" className="text-sm text-segal-dark cursor-pointer">
              Abrir en nueva pestaña
            </Label>
          </div>
        )}
      </div>

      {/* Estilos */}
      <div className="grid grid-cols-2 gap-4 border-t border-segal-blue/10 pt-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Bordes redondeados (px)
          </Label>
          <Input
            type="number"
            min="0"
            max="50"
            value={contenido.border_radius ?? 0}
            onChange={(e) => updateContenido({ 
              border_radius: parseInt(e.target.value) || 0 
            })}
            className="border-segal-blue/30"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Espaciado (px)
          </Label>
          <Input
            type="number"
            min="0"
            max="50"
            value={contenido.padding ?? 10}
            onChange={(e) => updateContenido({ 
              padding: parseInt(e.target.value) || 0 
            })}
            className="border-segal-blue/30"
          />
        </div>
      </div>

      {/* Preview */}
      {contenido.url && (
        <div className="border-t border-segal-blue/10 pt-4">
          <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
          <div 
            className="rounded border border-dashed border-segal-blue/20 p-4 bg-gray-50"
            style={{
              textAlign: contenido.alineacion || 'center',
            }}
          >
            <div style={{ padding: `${contenido.padding ?? 10}px`, display: 'inline-block' }}>
              {contenido.link_url ? (
                <a 
                  href={contenido.link_url} 
                  target={contenido.link_target || '_blank'}
                  onClick={(e) => e.preventDefault()}
                  className="inline-block"
                >
                  <img
                    src={contenido.url}
                    alt={contenido.alt || 'Imagen'}
                    style={{
                      maxWidth: contenido.ancho ? `${contenido.ancho}px` : '100%',
                      maxHeight: contenido.altura ? `${contenido.altura}px` : 'auto',
                      borderRadius: `${contenido.border_radius ?? 0}px`,
                      display: 'block',
                    }}
                  />
                </a>
              ) : (
                <img
                  src={contenido.url}
                  alt={contenido.alt || 'Imagen'}
                  style={{
                    maxWidth: contenido.ancho ? `${contenido.ancho}px` : '100%',
                    maxHeight: contenido.altura ? `${contenido.altura}px` : 'auto',
                    borderRadius: `${contenido.border_radius ?? 0}px`,
                    display: 'block',
                  }}
                />
              )}
            </div>
          </div>
          {contenido.link_url && (
            <p className="text-xs text-segal-blue mt-2 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Link: {contenido.link_url}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
