/**
 * Editor del componente Texto
 * Soporta: alineación, tamaño, color, estilos, enlaces
 */

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TextoComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'

interface TextoComponentEditorProps {
  componente: TextoComponentFormData
  onUpdate: (componente: TextoComponentFormData) => void
}

export function TextoComponentEditor({
  componente,
  onUpdate,
}: TextoComponentEditorProps) {
  const [mostrarFormularioEnlace, setMostrarFormularioEnlace] = useState(false)
  const [nuevoEnlace, setNuevoEnlace] = useState({ url: '', texto: '' })

  // Valores por defecto para evitar undefined
  const contenido = componente.contenido || {
    texto: '',
    alineacion: 'left' as const,
    tamano: 'normal' as const,
    color: '#333333',
    negrita: false,
    cursiva: false,
    subrayado: false,
    enlaces: [],
  }

  const agregarEnlace = () => {
    if (!nuevoEnlace.url || !nuevoEnlace.texto) return

    const nuevoContenido = {
      ...contenido,
      enlaces: [
        ...(contenido.enlaces || []),
        {
          url: nuevoEnlace.url,
          texto: nuevoEnlace.texto,
          posicion: contenido.texto.length,
        },
      ],
    }

    onUpdate({
      ...componente,
      contenido: nuevoContenido,
    })

    setNuevoEnlace({ url: '', texto: '' })
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
      {/* Texto */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto <span className="text-segal-red">*</span>
        </Label>
        <textarea
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
          className="w-full min-h-24 px-3 py-2 rounded-md border border-segal-blue/30 text-sm focus:outline-none focus:ring-2 focus:ring-segal-blue/20 focus:border-segal-blue"
          placeholder="Escribe el contenido del texto..."
        />
        <p className="text-xs text-segal-dark/60">
          {contenido.texto.length} caracteres
        </p>
      </div>

      {/* Alineación */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">Alineación</Label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((alineacion) => (
            <button
              key={alineacion}
              onClick={() =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    alineacion,
                  },
                })
              }
              className={`px-3 py-2 rounded text-sm font-medium transition-colors capitalize ${
                contenido.alineacion === alineacion
                  ? 'bg-segal-blue text-white'
                  : 'bg-segal-blue/10 text-segal-blue hover:bg-segal-blue/20'
              }`}
            >
              {alineacion}
            </button>
          ))}
        </div>
      </div>

      {/* Tamaño y color */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">
            Tamaño de fuente (px)
          </Label>
          <Input
            type="number"
            min="8"
            max="72"
            value={contenido.tamanio_fuente || 14}
            onChange={(e) =>
              onUpdate({
                ...componente,
                contenido: {
                  ...contenido,
                  tamanio_fuente: parseInt(e.target.value) || 14,
                },
              })
            }
            className="border-segal-blue/30"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-segal-dark">Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={contenido.color || '#000000'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    color: e.target.value,
                  },
                })
              }
              className="h-10 rounded border border-segal-blue/30 cursor-pointer"
            />
            <Input
              type="text"
              value={contenido.color || '#000000'}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    color: e.target.value,
                  },
                })
              }
              className="border-segal-blue/30 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Estilos */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">Estilos</Label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contenido.negrita || false}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    negrita: e.target.checked,
                  },
                })
              }
              className="rounded border-segal-blue/30 text-segal-blue"
            />
            <span className="text-sm font-bold text-segal-dark">Negrita</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contenido.italica || false}
              onChange={(e) =>
                onUpdate({
                  ...componente,
                  contenido: {
                    ...contenido,
                    italica: e.target.checked,
                  },
                })
              }
              className="rounded border-segal-blue/30 text-segal-blue"
            />
            <span className="text-sm italic text-segal-dark">Itálica</span>
          </label>
        </div>
      </div>

      {/* Enlaces */}
      <div className="space-y-3 border-t border-segal-blue/10 pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-segal-dark">Enlaces</Label>
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
              placeholder="Texto del enlace (ej: Haz clic aquí)"
              value={nuevoEnlace.texto}
              onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, texto: e.target.value })}
              className="border-segal-blue/30"
            />
            <Input
              type="url"
              placeholder="URL (ej: https://ejemplo.com)"
              value={nuevoEnlace.url}
              onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, url: e.target.value })}
              className="border-segal-blue/30"
            />
            <div className="flex gap-2">
              <Button
                onClick={agregarEnlace}
                className="bg-segal-blue hover:bg-segal-blue/90 text-white flex-1"
                disabled={!nuevoEnlace.url || !nuevoEnlace.texto}
              >
                Agregar
              </Button>
              <Button
                onClick={() => {
                  setMostrarFormularioEnlace(false)
                  setNuevoEnlace({ url: '', texto: '' })
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
                  <p className="font-medium text-segal-dark">{enlace.texto}</p>
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

      {/* Preview */}
      <div className="border-t border-segal-blue/10 pt-4">
        <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
        <div
          className="bg-segal-blue/5 rounded p-4 border border-segal-blue/10"
          style={{
            textAlign: contenido.alineacion as any,
            fontSize: `${contenido.tamanio_fuente || 14}px`,
            color: contenido.color || '#000000',
            fontWeight: contenido.negrita ? 'bold' : 'normal',
            fontStyle: contenido.italica ? 'italic' : 'normal',
          }}
        >
          {contenido.texto}
        </div>
      </div>
    </div>
  )
}
