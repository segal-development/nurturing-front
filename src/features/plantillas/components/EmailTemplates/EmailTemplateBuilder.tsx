/**
 * Email Template Builder
 * Interfaz visual para construir emails con bloques
 * Soporta agregar texto, links, botones dinámicamente
 */

import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import type { EmailBlockData } from './EmailBlock'
import { EmailTemplatePreview } from './EmailTemplatePreview'

export interface EmailTemplateBuilderProps {
  /**
   * Bloques iniciales
   */
  initialBlocks?: EmailBlockData[]

  /**
   * Callback cuando los bloques cambian
   */
  onChange?: (blocks: EmailBlockData[], html: string) => void

  /**
   * Mostrar preview en vivo
   */
  showPreview?: boolean

  /**
   * Configuración del template
   */
  config?: {
    preview?: string
    subject?: string
    headerImage?: string
    headerText?: string
    footerText?: string
    footerLink?: {
      text: string
      href: string
    }
  }
}

export function EmailTemplateBuilder({
  initialBlocks = [],
  onChange,
  showPreview = true,
  config,
}: EmailTemplateBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlockData[]>(initialBlocks)
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null)

  const blockTypes: EmailBlockData['type'][] = ['heading', 'text', 'link', 'button', 'section']

  const addBlock = (type: EmailBlockData['type']) => {
    const newBlock: EmailBlockData = {
      type,
      content: type === 'heading' ? 'Nuevo Encabezado' : 'Nuevo contenido',
      buttonText: type === 'button' ? 'Haz clic aquí' : undefined,
      href: type === 'button' || type === 'link' ? 'https://example.com' : undefined,
      align: 'left',
      color: 'gray',
      fontSize: type === 'heading' ? '2xl' : 'base',
    }

    const updatedBlocks = [...blocks, newBlock]
    setBlocks(updatedBlocks)
    setSelectedBlockIndex(updatedBlocks.length - 1)
  }

  const updateBlock = (index: number, updates: Partial<EmailBlockData>) => {
    const updatedBlocks = [...blocks]
    updatedBlocks[index] = { ...updatedBlocks[index], ...updates }
    setBlocks(updatedBlocks)
  }

  const deleteBlock = (index: number) => {
    const updatedBlocks = blocks.filter((_, i) => i !== index)
    setBlocks(updatedBlocks)
    setSelectedBlockIndex(null)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const updatedBlocks = [...blocks]
    if (direction === 'up' && index > 0) {
      [updatedBlocks[index], updatedBlocks[index - 1]] = [updatedBlocks[index - 1], updatedBlocks[index]]
      setSelectedBlockIndex(index - 1)
    } else if (direction === 'down' && index < updatedBlocks.length - 1) {
      [updatedBlocks[index], updatedBlocks[index + 1]] = [updatedBlocks[index + 1], updatedBlocks[index]]
      setSelectedBlockIndex(index + 1)
    }
    setBlocks(updatedBlocks)
  }

  const handleRender = (html: string) => {
    onChange?.(blocks, html)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Editor */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-lg border border-gray-300 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Bloques</h3>

          {/* Botones para agregar bloques */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {blockTypes.map((type) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-segal-blue border border-segal-blue/30 rounded hover:bg-segal-blue/5 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {type === 'heading' ? 'Título' : type === 'text' ? 'Texto' : type === 'link' ? 'Enlace' : type === 'button' ? 'Botón' : 'Sección'}
              </button>
            ))}
          </div>

          {/* Lista de bloques */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No hay bloques. Agrega uno para comenzar.
              </div>
            ) : (
              blocks.map((block, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedBlockIndex === index
                      ? 'border-segal-blue bg-segal-blue/5'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedBlockIndex(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 capitalize">
                        {block.type === 'heading' ? 'Título' : block.type === 'text' ? 'Texto' : block.type === 'link' ? 'Enlace' : block.type === 'button' ? 'Botón' : 'Sección'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {block.content || block.buttonText || '(vacío)'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveBlock(index, 'up')
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-3 w-3 rotate-180" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveBlock(index, 'down')
                        }}
                        disabled={index === blocks.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBlock(index)
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor de propiedades del bloque seleccionado */}
        {selectedBlockIndex !== null && blocks[selectedBlockIndex] && (
          <div className="bg-white rounded-lg border border-gray-300 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Propiedades</h3>
            <div className="space-y-3">
              {/* Contenido */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  {blocks[selectedBlockIndex].type === 'button' ? 'Texto del Botón' : 'Contenido'}
                </label>
                <textarea
                  value={blocks[selectedBlockIndex].content || ''}
                  onChange={(e) =>
                    updateBlock(selectedBlockIndex, { content: e.target.value })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20 resize-none h-16"
                  placeholder="Escribe el contenido..."
                />
              </div>

              {/* URL para links y botones */}
              {(blocks[selectedBlockIndex].type === 'button' ||
                blocks[selectedBlockIndex].type === 'link') && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={blocks[selectedBlockIndex].href || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex, { href: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {/* Alineación */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Alineación
                </label>
                <select
                  value={blocks[selectedBlockIndex].align || 'left'}
                  onChange={(e) =>
                    updateBlock(selectedBlockIndex, {
                      align: e.target.value as 'left' | 'center' | 'right',
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>

              {/* Color */}
              {blocks[selectedBlockIndex].type !== 'link' && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Color
                  </label>
                  <select
                    value={blocks[selectedBlockIndex].color || 'gray'}
                    onChange={(e) =>
                      updateBlock(selectedBlockIndex, { color: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                  >
                    <option value="gray">Gris</option>
                    <option value="blue">Azul</option>
                    <option value="green">Verde</option>
                    <option value="red">Rojo</option>
                  </select>
                </div>
              )}

              {/* Tamaño de fuente */}
              {blocks[selectedBlockIndex].type !== 'button' && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Tamaño
                  </label>
                  <select
                    value={blocks[selectedBlockIndex].fontSize || 'base'}
                    onChange={(e) =>
                      updateBlock(selectedBlockIndex, {
                        fontSize: e.target.value as EmailBlockData['fontSize'],
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-segal-blue focus:ring-1 focus:ring-segal-blue/20"
                  >
                    <option value="sm">Pequeño</option>
                    <option value="base">Normal</option>
                    <option value="lg">Grande</option>
                    <option value="xl">Muy Grande</option>
                    <option value="2xl">Gigante</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white rounded-lg border border-gray-300 p-4 overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Vista Previa</h3>
          <EmailTemplatePreview
            blocks={blocks}
            config={config}
            onRender={handleRender}
          />
        </div>
      )}
    </div>
  )
}
