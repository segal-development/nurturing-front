/**
 * Editor del componente Footer
 */

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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

  const agregarEnlace = () => {
    if (!nuevoEnlace.url || !nuevoEnlace.etiqueta) return

    onUpdate({
      ...componente,
      contenido: {
        ...componente.contenido,
        enlaces: [...(componente.contenido.enlaces || []), nuevoEnlace],
      },
    })

    setNuevoEnlace({ url: '', etiqueta: '' })
    setMostrarFormularioEnlace(false)
  }

  const eliminarEnlace = (index: number) => {
    onUpdate({
      ...componente,
      contenido: {
        ...componente.contenido,
        enlaces: componente.contenido.enlaces?.filter((_, i) => i !== index) || [],
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Texto */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-segal-dark">
          Texto del footer <span className="text-segal-red">*</span>
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
          placeholder="Grupo Segal"
          className="border-segal-blue/30"
        />
      </div>

      {/* Mostrar fecha */}
      <div className="flex items-center gap-2">
        <input
          id="footer-fecha"
          type="checkbox"
          checked={componente.contenido.mostrar_fecha || false}
          onChange={(e) =>
            onUpdate({
              ...componente,
              contenido: {
                ...componente.contenido,
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
        {componente.contenido.enlaces && componente.contenido.enlaces.length > 0 && (
          <div className="space-y-2">
            {componente.contenido.enlaces.map((enlace, index) => (
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

      {/* Preview */}
      <div className="border-t border-segal-blue/10 pt-4">
        <p className="text-xs text-segal-dark/60 mb-2">Preview:</p>
        <div className="bg-segal-blue/5 rounded p-4 border border-segal-blue/10 text-center text-sm">
          <p className="text-segal-dark/80 mb-2">{componente.contenido.texto}</p>
          {componente.contenido.enlaces && componente.contenido.enlaces.length > 0 && (
            <div className="flex justify-center gap-4 text-xs">
              {componente.contenido.enlaces.map((enlace, idx) => (
                <a
                  key={idx}
                  href={enlace.url}
                  className="text-segal-blue hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  {enlace.etiqueta}
                </a>
              ))}
            </div>
          )}
          {componente.contenido.mostrar_fecha && (
            <p className="text-segal-dark/50 text-xs mt-2">
              Enviado: {new Date().toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
