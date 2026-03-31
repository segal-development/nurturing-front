/**
 * Full-screen page for AI-powered template creation
 * Split layout: Chat (60%) | Preview (40%)
 * Mobile: Tabs to switch between Chat and Preview
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, MessageSquare, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChatPanel } from '../components/chat/ChatPanel'
import { TemplatePreviewPanel } from '../components/chat/TemplatePreviewPanel'
import { SaveTemplateModal } from '../components/chat/SaveTemplateModal'
import { usePlantillaChat } from '../hooks/usePlantillaChat'
import { plantillaChatService } from '@/api/plantillaChat.service'
import type { TemplatePreview } from '../types/chat'

type MobileTab = 'chat' | 'preview'

export function PlantillaChatPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Chat hook
  const {
    messages,
    currentTemplate,
    isLoading,
    isThinking,
    error,
    sendMessage,
    clearHistory,
    retryLastMessage,
  } = usePlantillaChat()

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateToSave, setTemplateToSave] = useState<TemplatePreview | null>(null)
  const [existingTemplateId, setExistingTemplateId] = useState<number | null>(null)

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')

  // Handle saving new template
  const handleSaveNew = (template: TemplatePreview) => {
    setTemplateToSave(template)
    setExistingTemplateId(null)
    setSaveModalOpen(true)
  }

  // Handle updating existing template
  const handleUpdate = async (template: TemplatePreview, templateId: number) => {
    setIsSaving(true)
    try {
      await plantillaChatService.saveTemplate({
        template,
        existing_id: templateId,
      })
      
      // Invalidate plantillas queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['plantillas'] })
      
      toast.success('Plantilla actualizada exitosamente', {
        description: 'Los cambios fueron guardados correctamente',
        action: {
          label: 'Ver plantillas',
          onClick: () => navigate('/plantillas'),
        },
      })
    } catch (error: any) {
      logger.error('[PlantillaChatPage] Error updating template:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar plantilla'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle save modal submit
  const handleSaveSubmit = async (nombre: string, descripcion: string) => {
    if (!templateToSave) return

    setIsSaving(true)
    try {
      const result = await plantillaChatService.saveTemplate({
        template: {
          ...templateToSave,
          nombre,
        },
        nombre,
        descripcion,
        existing_id: existingTemplateId ?? undefined,
      })
      
      // Invalidate plantillas queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['plantillas'] })
      
      toast.success('Plantilla guardada exitosamente', {
        description: `"${nombre}" fue creada correctamente`,
        action: {
          label: 'Ver plantillas',
          onClick: () => navigate('/plantillas'),
        },
      })
      logger.log('[PlantillaChatPage] Template saved with ID:', result.id)
      
      // Store the new template ID for potential updates
      setExistingTemplateId(result.id)
    } catch (error: any) {
      logger.error('[PlantillaChatPage] Error saving template:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar plantilla'
      toast.error(errorMessage)
      throw error // Re-throw to keep modal open
    } finally {
      setIsSaving(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    navigate('/plantillas')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Top header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 sm:px-3"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-segal-blue dark:text-segal-turquoise" />
            <h1 className="text-base sm:text-lg font-semibold text-segal-dark dark:text-white">
              <span className="hidden sm:inline">Crear Plantilla con IA</span>
              <span className="sm:hidden">Plantilla IA</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Mobile tabs - only visible on mobile */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            mobileTab === 'chat'
              ? 'text-segal-blue dark:text-segal-turquoise border-b-2 border-segal-blue dark:border-segal-turquoise'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative',
            mobileTab === 'preview'
              ? 'text-segal-blue dark:text-segal-turquoise border-b-2 border-segal-blue dark:border-segal-turquoise'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <Eye className="w-4 h-4" />
          Vista Previa
          {/* Badge when template is ready */}
          {currentTemplate && currentTemplate.componentes.length > 0 && mobileTab !== 'preview' && (
            <span className="absolute top-2 right-1/4 w-2 h-2 bg-segal-blue dark:bg-segal-turquoise rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Main content - split layout on desktop, tabbed on mobile */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat panel - 60% on desktop, hidden on mobile when preview tab active */}
        <div 
          className={cn(
            'flex-1 min-h-0',
            'lg:max-w-[60%] lg:border-r lg:border-gray-200 lg:dark:border-gray-700',
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          )}
        >
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            isThinking={isThinking}
            error={error}
            onSendMessage={sendMessage}
            onClearHistory={clearHistory}
            onRetry={retryLastMessage}
          />
        </div>

        {/* Preview panel - 40% on desktop, hidden on mobile when chat tab active */}
        <div 
          className={cn(
            'flex-1 min-h-0 lg:flex-1',
            mobileTab === 'chat' ? 'hidden lg:block' : 'block'
          )}
        >
          <TemplatePreviewPanel
            template={currentTemplate}
            existingTemplateId={existingTemplateId}
            isSaving={isSaving}
            isGenerating={isLoading}
            onSaveNew={handleSaveNew}
            onUpdate={handleUpdate}
          />
        </div>
      </div>

      {/* Save modal */}
      {templateToSave && (
        <SaveTemplateModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          template={templateToSave}
          isSaving={isSaving}
          onSave={handleSaveSubmit}
        />
      )}
    </div>
  )
}
