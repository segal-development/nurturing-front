/**
 * Editor del componente Footer
 */

import { useState } from 'react'
import { Plus, Trash2, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { FooterComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

interface FooterComponentEditorProps {
  componente: FooterComponentFormData
  onUpdate: (componente: FooterComponentFormData) => void
}

export function FooterComponentEditor({
  componente,
  onUpdate,
}: FooterComponentEditorProps) {
  const [mostrarFormularioEnlace, setMostrarFormularioEnlace] = useState(false)
  const [nuevoEnlace, setNuevoEnlace] = useState({ url: '', etiqueta: '' })

  // Valores por defecto para evitar undefined
  const contenido = componente.contenido || {
    texto: '',
    mostrar_fecha: false,
    enlaces: [],
    color_fondo: undefined,
    color_texto: '#666666',
    padding: 20,
  }

  const agregarEnlace = () => {
    if (!nuevoEnlace.url || !nuevoEnlace.etiqueta) return

    onUpdate({
      ...componente,
      contenido: {
        ...contenido,
        enlaces: [...(contenido.enlaces || []), nuevoEnlace],
      },
    })

    setNuevoEnlace({ url: '', etiqueta: '' })
    setMostrarFormularioEnlace(false)
  }

  const eliminarEnlace = (index: number) => {
    onUpdate({
      ...componente,
      contenido: {
        ...contenido,
        enlaces: contenido.enlaces?.filter((_: any, i: number) => i !== index) || [],
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Aviso sobre footer del proveedor SMTP */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800">
          <p className="font-semibold">Nota sobre el footer de emails</p>
          <p className="mt-1">
            El proveedor de email agrega automáticamente un footer con información de compliance 
            y un enlace para desuscribirse. Si agregas tu propio footer, aparecerán ambos en el email final.
          </p>
        </div>
      </div>

      {/* Texto */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto del footer <span className="text-segal-red">*</span>
        </Label>
        <Input
          type="text"
          value={contenido.texto || ''}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...contenido,
                texto: e.target.value,
              },
            })
          }
          placeholder="Grupo Segal"
          className="border-segal-blue/30"
        />
      </div>

      {/* Mostrar fecha */}
      <div className="flex items-center gap-2">
        <input
          id="footer-fecha"
          type="checkbox"
          checked={contenido.mostrar_fecha || false}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...contenido,
                mostrar_fecha: e.target.checked,
              },
            })
          }
          className="rounded border-segal-blue/30 text-segal-blue"
        />
        <Label htmlFor="footer-fecha" className="text-sm font-medium text-segal-dark cursor-pointer">
          Mostrar fecha de envío
        </Label>
      </div>

      {/* Enlaces del footer */}
      <div className="space-y-3 border-t border-segal-blue/10 pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-segal-dark">Enlaces del footer</Label>
          <Button
            onClick={() => setMostrarFormularioEnlace(!mostrarFormularioEnlace)}
            variant="outline"
            size="sm"
            className="border-segal-blue/30 text-segal-blue hover:bg-segal-blue/5"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar enlace
          </Button>
        </div>

        {mostrarFormularioEnlace && (
          <div className="bg-segal-blue/5 rounded-lg p-4 space-y-3 border border-segal-blue/20">
            <Input
              type="text"
              placeholder="Etiqueta del enlace (ej: Política de privacidad)"
              value={nuevoEnlace.etiqueta}
              onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, etiqueta: e.target.value })}
              className="border-segal-blue/30"
            />
            <Input
              type="url"
              placeholder="URL (ej: https://ejemplo.com/privacidad)"
              value={nuevoEnlace.url}
              onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, url: e.target.value })}
              className="border-segal-blue/30"
            />
            <div className="flex gap-2">
              <Button
                onClick={agregarEnlace}
                className="bg-segal-blue hover:bg-segal-blue/90 text-white flex-1"
                disabled={!nuevoEnlace.url || !nuevoEnlace.etiqueta}
              >
                Agregar
              </Button>
              <Button
                onClick={() => {
                  setMostrarFormularioEnlace(false)
                  setNuevoEnlace({ url: '', etiqueta: '' })
                }}
                variant="outline"
                className="border-segal-blue/30 text-segal-dark hover:bg-segal-blue/5 flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de enlaces */}
        {contenido.enlaces && contenido.enlaces.length > 0 && (
          <div className="space-y-2">
            {contenido.enlaces.map((enlace: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between bg-segal-blue/10 rounded p-2 border border-segal-blue/20"
              >
                <div className="text-sm">
                  <p className="font-medium text-segal-dark">{enlace.etiqueta}</p>
                  <p className="text-xs text-segal-dark/60 truncate">{enlace.url}</p>
                </div>
                <button
                  onClick={() => eliminarEnlace(index)}
                  className="p-1 text-segal-dark/60 hover:text-segal-red hover:bg-segal-red/10 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Colores */}
      <div className="space-y-3 border-t border-segal-blue/10 pt-4">
        <Label className="text-sm font-semibold text-segal-dark">Estilos</Label>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Color de fondo */}
          <div className="space-y-2">
            <Label className="text-xs text-segal-dark/70">Color de fondo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={contenido.color_fondo || '#f5f5f5'}
                onChange={(e) =>
                  onUpdate({
                    ...componente,
                    contenido: {
                      ...contenido,
                      color_fondo: e.target.value,
                    },
                  })
                }
                className="w-10 h-8 p-1 border-segal-blue/30 cursor-pointer"
              />
              <Input
                type="text"
                value={contenido.color_fondo || ''}
                onChange={(e) =>
                  onUpdate({
                    ...componente,
                    contenido: {
                      ...contenido,
                      color_fondo: e.target.value || undefined,
                    },
                  })
                }
                placeholder="Sin fondo"
                className="flex-1 border-segal-blue/30 text-xs"
              />
            </div>
          </div>

          {/* Color de texto */}
          <div className="space-y-2">
            <Label className="text-xs text-segal-dark/70">Color de texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={contenido.color_texto || '#666666'}
                onChange={(e) =>
                  onUpdate({
                    ...componente,
                    contenido: {
                      ...contenido,
                      color_texto: e.target.value,
                    },
                  })
                }
                className="w-10 h-8 p-1 border-segal-blue/30 cursor-pointer"
              />
              <Input
                type="text"
                value={contenido.color_texto || '#666666'}
                onChange={(e) =>
                  onUpdate({
                    ...componente,
                    contenido: {
                      ...contenido,
                      color_texto: e.target.value || '#666666',
                    },
                  })
                }
                className="flex-1 border-segal-blue/30 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Padding */}
        <div className="space-y-2">
          <Label className="text-xs text-segal-dark/70">Espaciado interno (px)</Label>
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
            className="border-segal-blue/30 w-24"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-segal-blue/10 pt-4">
        <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
        <div 
          className="rounded text-center text-sm"
          style={{
            backgroundColor: contenido.color_fondo || '#f5f5f5',
            color: contenido.color_texto || '#666666',
            padding: `${contenido.padding ?? 20}px`,
          }}
        >
          <p className="mb-2">{contenido.texto}</p>
          {contenido.enlaces && contenido.enlaces.length > 0 && (
            <div className="flex justify-center gap-4 text-xs">
              {contenido.enlaces.map((enlace: any, idx: number) => (
                <a
                  key={`footer-link-${idx}`}
                  href={enlace.url}
                  className="hover:underline"
                  style={{ color: contenido.color_texto || '#666666' }}
                  onClick={(e) => e.preventDefault()}
                >
                  {enlace.etiqueta}
                </a>
              ))}
            </div>
          )}
          {contenido.mostrar_fecha && (
            <p className="text-xs mt-2 opacity-70">
              Enviado: {new Date().toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
