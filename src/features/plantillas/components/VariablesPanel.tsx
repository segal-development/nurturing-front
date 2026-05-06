/**
 * Panel de variables disponibles para plantillas
 * Muestra variables organizadas por categoría con click para insertar
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Copy, Info, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { plantillasService } from '@/api/plantillas.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { VariableDisponible } from '@/types/plantilla'

interface VariablesPanelProps {
  onInsertVariable: (variable: string) => void
  className?: string
}

interface CategorySectionProps {
  title: string
  icon: string
  variables: VariableDisponible[]
  onInsert: (variable: string) => void
  defaultOpen?: boolean
  searchTerm: string
}

function CategorySection({
  title,
  icon,
  variables,
  onInsert,
  defaultOpen = true,
  searchTerm,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Filtrar variables por búsqueda
  const filteredVariables = searchTerm
    ? variables.filter(
        (v) =>
          v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : variables

  if (filteredVariables.length === 0) return null

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-base">{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {filteredVariables.length}
        </span>
      </button>

      {isOpen && (
        <div className="px-2 pb-2 space-y-1">
          {filteredVariables.map((variable) => (
            <VariableItem
              key={variable.key}
              variable={variable}
              onInsert={onInsert}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface VariableItemProps {
  variable: VariableDisponible
  onInsert: (variable: string) => void
}

function VariableItem({ variable, onInsert }: VariableItemProps) {
  const variableTag = `{{${variable.key}}}`

  const handleClick = async () => {
    // Copiar al portapapeles Y insertar
    try {
      await navigator.clipboard.writeText(variableTag)
      onInsert(variableTag)
      toast.success(`${variableTag} insertada y copiada`, { duration: 1500 })
    } catch {
      // Si falla el clipboard, al menos insertar
      onInsert(variableTag)
      toast.success(`Variable ${variableTag} insertada`, { duration: 1500 })
    }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(variableTag)
      toast.success(`${variableTag} copiada`, { duration: 1500 })
    } catch {
      toast.error('Error al copiar al portapapeles')
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', variableTag)
    e.dataTransfer.setData('application/x-variable', variableTag)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-segal-blue/10 dark:hover:bg-segal-turquoise/10 transition-colors group cursor-grab active:cursor-grabbing"
          >
            <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-segal-blue dark:text-segal-turquoise">
              {`{{${variable.key}}}`}
            </code>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {variable.label}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copiar variable"
            >
              <Copy className="h-3 w-3 text-gray-400" />
            </button>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{variable.label}</p>
            <p className="text-xs text-gray-400">
              Ejemplo: <span className="text-gray-300">{variable.ejemplo}</span>
            </p>
            <p className="text-xs text-gray-500">Click para insertar y copiar</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function VariablesPanel({ onInsertVariable, className = '' }: VariablesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['plantillas', 'variables-disponibles'],
    queryFn: () => plantillasService.getVariablesDisponibles(),
    staleTime: 5 * 60 * 1000, // 5 minutos - las variables no cambian frecuentemente
  })

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-segal-blue dark:text-segal-turquoise" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-sm text-red-500 ${className}`}>
        Error al cargar variables
      </div>
    )
  }

  if (!data) return null

  const hasResults =
    searchTerm === '' ||
    [...data.basicas, ...data.sistema, ...(data.abogado || []), ...(data.cuotas || []), ...data.metadata].some(
      (v) =>
        v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Variables Disponibles
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">
                  Haz click en una variable para insertarla en el contenido.
                  Las variables se reemplazan automáticamente con los datos del prospecto al enviar.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar variable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto">
        {!hasResults ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No se encontraron variables
          </div>
        ) : (
          <>
            <CategorySection
              title="Datos del Prospecto"
              icon="👤"
              variables={data.basicas}
              onInsert={onInsertVariable}
              defaultOpen={true}
              searchTerm={searchTerm}
            />
            <CategorySection
              title="Sistema"
              icon="📅"
              variables={data.sistema}
              onInsert={onInsertVariable}
              defaultOpen={true}
              searchTerm={searchTerm}
            />
            {data.abogado && data.abogado.length > 0 && (
              <CategorySection
                title="Abogado Asignado"
                icon="⚖️"
                variables={data.abogado}
                onInsert={onInsertVariable}
                defaultOpen={true}
                searchTerm={searchTerm}
              />
            )}
            {data.cuotas && data.cuotas.length > 0 && (
              <CategorySection
                title="Cuotas y Pagos"
                icon="💰"
                variables={data.cuotas}
                onInsert={onInsertVariable}
                defaultOpen={true}
                searchTerm={searchTerm}
              />
            )}
            {data.metadata.length > 0 && (
              <CategorySection
                title="Metadata (Importaciones)"
                icon="📁"
                variables={data.metadata}
                onInsert={onInsertVariable}
                defaultOpen={false}
                searchTerm={searchTerm}
              />
            )}
          </>
        )}
      </div>

      {/* Footer tip */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Escribe <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{'{{'}</code> en el editor para autocompletar
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          🖱️ También podés arrastrar y soltar las variables
        </p>
      </div>
    </div>
  )
}
