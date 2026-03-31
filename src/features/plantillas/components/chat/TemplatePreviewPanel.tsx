/**
 * Template Preview Panel for the AI chat feature
 * Shows live preview of the template being created/modified
 * Includes Desktop/Mobile toggle and Save/Update buttons
 */

import { useState } from 'react'
import { Monitor, Smartphone, Save, RefreshCw, Eye, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EmailPreview } from '../email/EmailPreview'
import type { TemplatePreview } from '../../types/chat'

type ViewMode = 'desktop' | 'mobile'

interface TemplatePreviewPanelProps {
  template: TemplatePreview | null
  existingTemplateId?: number | null
  isSaving?: boolean
  isGenerating?: boolean
  onSaveNew: (template: TemplatePreview) => void
  onUpdate: (template: TemplatePreview, templateId: number) => void
}

export function TemplatePreviewPanel({
  template,
  existingTemplateId,
  isSaving = false,
  isGenerating = false,
  onSaveNew,
  onUpdate,
}: TemplatePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')

  const hasTemplate = template && template.componentes.length > 0
  const canUpdate = hasTemplate && existingTemplateId != null

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800/50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-segal-blue dark:text-segal-turquoise" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Vista Previa
          </h3>
          {template?.nombre && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              — {template.nombre}
            </span>
          )}
        </div>

        {/* Desktop/Mobile toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'desktop'
                ? 'bg-white dark:bg-gray-600 text-segal-blue dark:text-segal-turquoise shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            title="Vista Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'mobile'
                ? 'bg-white dark:bg-gray-600 text-segal-blue dark:text-segal-turquoise shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            title="Vista Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Generating skeleton state */}
        {isGenerating && !hasTemplate && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-segal-blue/10 dark:bg-segal-turquoise/10 flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-segal-blue dark:text-segal-turquoise animate-pulse" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Generando plantilla...
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              El asistente está creando tu plantilla
            </p>
            
            {/* Skeleton preview */}
            <div 
              className={cn(
                'w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
                viewMode === 'desktop' ? 'max-w-lg' : 'max-w-[375px]'
              )}
            >
              {/* Header skeleton */}
              <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              
              {/* Content skeleton */}
              <div className="p-6 space-y-4 bg-white dark:bg-gray-800">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40 mx-auto mt-6" />
              </div>
              
              {/* Footer skeleton */}
              <div className="h-12 bg-gray-100 dark:bg-gray-700/50 animate-pulse" />
            </div>
          </div>
        )}

        {/* Template preview */}
        {hasTemplate && (
          <div
            className={cn(
              'mx-auto transition-all duration-300',
              viewMode === 'desktop' ? 'max-w-full' : 'max-w-[375px]'
            )}
          >
            <EmailPreview
              plantilla={{
                tipo: 'email',
                nombre: template.nombre,
                descripcion: '',
                activo: true,
                asunto: template.asunto,
                componentes: template.componentes,
              }}
            />
          </div>
        )}

        {/* Empty state (only show when not generating and no template) */}
        {!isGenerating && !hasTemplate && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Sin plantilla para mostrar
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Describile al asistente qué plantilla necesitás y la vista previa aparecerá aquí
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-0 flex items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <Button
          onClick={() => template && onSaveNew(template)}
          disabled={!hasTemplate || isSaving}
          className={cn(
            'flex-1',
            'bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90',
            'text-white dark:text-gray-900',
            'disabled:opacity-50'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar como Nueva
            </>
          )}
        </Button>

        {canUpdate && (
          <Button
            variant="outline"
            onClick={() => template && onUpdate(template, existingTemplateId)}
            disabled={isSaving}
            className={cn(
              'flex-1',
              'border-segal-blue/30 dark:border-gray-600',
              'text-segal-blue dark:text-segal-turquoise',
              'hover:bg-segal-blue/5 dark:hover:bg-gray-800',
              'disabled:opacity-50'
            )}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar Plantilla
          </Button>
        )}
      </div>
    </div>
  )
}
