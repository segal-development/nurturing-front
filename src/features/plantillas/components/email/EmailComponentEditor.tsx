/**
 * Editor individual de componentes de email
 * Soporta diferentes tipos: logo, texto, botón, separador, footer
 */

import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, ChevronDown as ChevronDownIcon } from 'lucide-react'
import type { EmailComponentFormData } from '@/features/plantillas/schemas/plantillaSchemas'
import { BotonComponentEditor } from './components/BotonComponentEditor'
import { FooterComponentEditor } from './components/FooterComponentEditor'
import { ImagenComponentEditor } from './components/ImagenComponentEditor'
import { LogoComponentEditor } from './components/LogoComponentEditor'
import { SeparadorComponentEditor } from './components/SeparadorComponentEditor'
import { TextoComponentEditor } from './components/TextoComponentEditor'

interface EmailComponentEditorProps {
  componente: EmailComponentFormData
  isSeleccionado: boolean
  onSelect: () => void
  onUpdate: (componente: EmailComponentFormData) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function EmailComponentEditor({
  componente,
  isSeleccionado,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: EmailComponentEditorProps) {
  const [isExpanded, setIsExpanded] = useState(isSeleccionado)

  const getTipoLabel = (): string => {
    const labels: Record<EmailComponentFormData['tipo'], string> = {
      logo: '🖼️ Logo',
      texto: '📝 Texto',
      boton: '🔘 Botón',
      separador: '─ Separador',
      imagen: '🖼️ Imagen',
      footer: '📋 Footer',
    }
    return labels[componente.tipo]
  }

  const handleClick = () => {
    onSelect()
    setIsExpanded(true)
  }

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        isSeleccionado
          ? 'border-segal-blue bg-segal-blue/5'
          : 'border-segal-blue/20 bg-white hover:border-segal-blue/40'
      }`}
    >
      {/* Header */}
      <div
        onClick={handleClick}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-segal-blue/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="text-segal-dark/60 hover:text-segal-dark transition-colors"
          >
            <ChevronDownIcon
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          <span className="font-medium text-segal-dark">{getTipoLabel()}</span>
          {componente.tipo === 'texto' && componente.contenido?.texto && (
            <span className="text-xs text-segal-dark/60 truncate">
              "{componente.contenido.texto.substring(0, 30)}"
            </span>
          )}
          {componente.tipo === 'boton' && componente.contenido?.texto && (
            <span className="text-xs text-segal-dark/60">{componente.contenido.texto}</span>
          )}
          {componente.tipo === 'logo' && componente.contenido?.url && (
            <span className="text-xs text-segal-dark/60 truncate">{componente.contenido.url}</span>
          )}
        </div>

        {/* Controles */}
        <div className="flex gap-1">
          {onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp()
              }}
              className="p-1 text-segal-dark/60 hover:text-segal-blue hover:bg-segal-blue/10 rounded transition-colors"
              title="Mover arriba"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown()
              }}
              className="p-1 text-segal-dark/60 hover:text-segal-blue hover:bg-segal-blue/10 rounded transition-colors"
              title="Mover abajo"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-segal-dark/60 hover:text-segal-red hover:bg-segal-red/10 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="border-t border-segal-blue/20 p-4 bg-white space-y-4">
          {componente.tipo === 'texto' && (
            <TextoComponentEditor
              componente={componente}
              onUpdate={onUpdate}
            />
          )}
          {componente.tipo === 'logo' && (
            <LogoComponentEditor
              componente={componente}
              onUpdate={onUpdate}
            />
          )}
          {componente.tipo === 'boton' && (
            <BotonComponentEditor
              componente={componente}
              onUpdate={onUpdate}
            />
          )}
          {componente.tipo === 'separador' && (
            <SeparadorComponentEditor
              componente={componente}
              onUpdate={onUpdate}
            />
          )}
          {componente.tipo === 'imagen' && (
            <ImagenComponentEditor
              componente={componente}
              onUpdate={onUpdate}
            />
          )}
          {componente.tipo === 'footer' && (
            <FooterComponentEditor
              componente={componente}
              onUpdate={onUpdate}
            />
          )}
        </div>
      )}
    </div>
  )
}
