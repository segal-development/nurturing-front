/**
 * PlantillaSelectorModal - Modal para seleccionar plantillas con búsqueda y preview
 * 
 * Features:
 * - Búsqueda por nombre y descripción
 * - Filtro por estado (activas/todas)
 * - Preview de la plantilla antes de seleccionar
 * - Diseño responsive y accesible
 */

import { useState, useMemo } from 'react'
import { Search, X, Mail, MessageSquare, Check, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { AnyPlantilla, PlantillaEmail } from '@/types/plantilla'

// ============================================================================
// TYPES
// ============================================================================

interface PlantillaSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantillas: AnyPlantilla[]
  tipo: 'sms' | 'email'
  selectedId?: number
  onSelect: (plantilla: AnyPlantilla) => void
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

function matchesSearch(plantilla: AnyPlantilla, search: string): boolean {
  const searchLower = search.toLowerCase()
  const nameMatch = plantilla.nombre.toLowerCase().includes(searchLower)
  const descMatch = plantilla.descripcion?.toLowerCase().includes(searchLower) ?? false
  
  // Para SMS, también buscar en contenido
  if ('contenido' in plantilla) {
    const contentMatch = plantilla.contenido.toLowerCase().includes(searchLower)
    return nameMatch || descMatch || contentMatch
  }
  
  // Para Email, también buscar en asunto
  if ('asunto' in plantilla) {
    const subjectMatch = plantilla.asunto.toLowerCase().includes(searchLower)
    return nameMatch || descMatch || subjectMatch
  }
  
  return nameMatch || descMatch
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PlantillaListItemProps {
  plantilla: AnyPlantilla
  tipo: 'sms' | 'email'
  isSelected: boolean
  isHighlighted: boolean
  onClick: () => void
  onPreview: () => void
}

function PlantillaListItem({
  plantilla,
  tipo,
  isSelected,
  isHighlighted,
  onClick,
  onPreview,
}: PlantillaListItemProps) {
  const Icon = tipo === 'sms' ? MessageSquare : Mail
  const isSMS = tipo === 'sms'
  
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected 
          ? 'border-segal-blue bg-segal-blue/10' 
          : isHighlighted
            ? 'border-segal-blue/50 bg-segal-blue/5'
            : 'border-gray-200 hover:border-segal-blue/30 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg shrink-0
          ${isSMS ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}
        `}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-segal-dark truncate">
              {plantilla.nombre}
            </h4>
            {isSelected && (
              <Check className="h-4 w-4 text-segal-blue shrink-0" />
            )}
            {!plantilla.activo && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                Inactiva
              </span>
            )}
          </div>
          
          {plantilla.descripcion && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {plantilla.descripcion}
            </p>
          )}
          
          {/* Preview del contenido */}
          {isSMS && 'contenido' in plantilla && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 italic">
              "{truncateText(plantilla.contenido, 80)}"
            </p>
          )}
          
          {!isSMS && 'asunto' in plantilla && (
            <p className="text-xs text-gray-400 mt-1">
              Asunto: {truncateText(plantilla.asunto, 50)}
            </p>
          )}
        </div>
        
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-segal-blue transition-colors shrink-0"
          title="Ver preview"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface PlantillaPreviewProps {
  plantilla: AnyPlantilla
  tipo: 'sms' | 'email'
  onClose: () => void
  onSelect: () => void
}

function PlantillaPreview({ plantilla, tipo, onClose, onSelect }: PlantillaPreviewProps) {
  const isSMS = tipo === 'sms'
  
  return (
    <div className="border-l border-gray-200 pl-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-segal-dark">Preview</h4>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</p>
          <p className="text-sm font-medium text-segal-dark">{plantilla.nombre}</p>
        </div>
        
        {plantilla.descripcion && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción</p>
            <p className="text-sm text-gray-700">{plantilla.descripcion}</p>
          </div>
        )}
        
        {isSMS && 'contenido' in plantilla && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contenido</p>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{plantilla.contenido}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">{plantilla.contenido.length}/160 caracteres</p>
          </div>
        )}
        
        {!isSMS && 'asunto' in plantilla && (
          <>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asunto</p>
              <p className="text-sm text-gray-700">{plantilla.asunto}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Componentes</p>
              <p className="text-sm text-gray-700">
                {(plantilla as PlantillaEmail).componentes?.length ?? 0} componente(s)
              </p>
            </div>
          </>
        )}
        
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</p>
          <span className={`
            inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            ${plantilla.activo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
            }
          `}>
            {plantilla.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>
      
      <Button
        onClick={onSelect}
        className="w-full bg-segal-blue hover:bg-segal-blue/90 text-white"
      >
        <Check className="h-4 w-4 mr-2" />
        Seleccionar esta plantilla
      </Button>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlantillaSelectorModal({
  open,
  onOpenChange,
  plantillas,
  tipo,
  selectedId,
  onSelect,
}: PlantillaSelectorModalProps) {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [previewPlantilla, setPreviewPlantilla] = useState<AnyPlantilla | null>(null)
  // highlightedId for keyboard navigation (setter reserved for future use)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  void setHighlightedId // Reserved for keyboard navigation
  
  // Filter plantillas
  const filteredPlantillas = useMemo(() => {
    return plantillas.filter((p) => {
      // Filter by active status
      if (!showInactive && !p.activo) return false
      
      // Filter by search
      if (search && !matchesSearch(p, search)) return false
      
      return true
    })
  }, [plantillas, search, showInactive])
  
  const handleSelect = (plantilla: AnyPlantilla) => {
    onSelect(plantilla)
    onOpenChange(false)
    setSearch('')
    setPreviewPlantilla(null)
  }
  
  const handleClose = () => {
    onOpenChange(false)
    setSearch('')
    setPreviewPlantilla(null)
  }
  
  const label = tipo === 'sms' ? 'SMS' : 'Email'
  const Icon = tipo === 'sms' ? MessageSquare : Mail
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${tipo === 'sms' ? 'text-green-600' : 'text-purple-600'}`} />
            Seleccionar Plantilla {label}
          </DialogTitle>
        </DialogHeader>
        
        {/* Search and filters */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, descripción o contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 text-gray-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-segal-blue focus:ring-segal-blue/20"
            />
            Mostrar inactivas
          </label>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex gap-4 py-3">
          {/* List */}
          <div className={`flex-1 overflow-y-auto space-y-2 pr-2 ${previewPlantilla ? 'max-w-[50%]' : ''}`}>
            {filteredPlantillas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {search 
                    ? 'No se encontraron plantillas con esa búsqueda'
                    : 'No hay plantillas disponibles'
                  }
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  {filteredPlantillas.length} plantilla{filteredPlantillas.length !== 1 ? 's' : ''} encontrada{filteredPlantillas.length !== 1 ? 's' : ''}
                </p>
                {filteredPlantillas.map((plantilla) => (
                  <PlantillaListItem
                    key={plantilla.id}
                    plantilla={plantilla}
                    tipo={tipo}
                    isSelected={plantilla.id === selectedId}
                    isHighlighted={plantilla.id === highlightedId}
                    onClick={() => handleSelect(plantilla)}
                    onPreview={() => setPreviewPlantilla(plantilla)}
                  />
                ))}
              </>
            )}
          </div>
          
          {/* Preview panel */}
          {previewPlantilla && (
            <div className="w-[45%] shrink-0">
              <PlantillaPreview
                plantilla={previewPlantilla}
                tipo={tipo}
                onClose={() => setPreviewPlantilla(null)}
                onSelect={() => handleSelect(previewPlantilla)}
              />
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
