/**
 * Main chat panel component
 * Contains header, message list, and input
 */

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Bot, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

interface ChatPanelProps {
  messages: ChatMessageType[]
  isLoading?: boolean
  isThinking?: boolean
  error?: string | null
  onSendMessage: (message: string) => void
  onClearHistory: () => void
  onRetry?: () => void
}

export function ChatPanel({
  messages,
  isLoading = false,
  isThinking = false,
  error,
  onSendMessage,
  onClearHistory,
  onRetry,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Check if there's any unsaved work (messages exist)
  const hasUnsavedWork = messages.length > 0

  // Handle clear history with confirmation
  const handleClearClick = () => {
    if (hasUnsavedWork) {
      setShowClearConfirm(true)
    } else {
      onClearHistory()
    }
  }

  const handleConfirmClear = () => {
    setShowClearConfirm(false)
    onClearHistory()
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isThinking])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-segal-blue dark:bg-segal-turquoise flex items-center justify-center">
            <Bot className="w-4 h-4 text-white dark:text-gray-900" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Asistente de Plantillas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Creá y modificá plantillas de email con IA
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearClick}
          disabled={isLoading || messages.length === 0}
          className={cn(
            'text-xs gap-1.5',
            'border-gray-300 dark:border-gray-600',
            'text-gray-600 dark:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-50'
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Nueva Conversación
        </Button>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Empty state */}
        {messages.length === 0 && !isThinking && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-segal-blue/10 dark:bg-segal-turquoise/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-segal-blue dark:text-segal-turquoise" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Hola! Soy tu asistente de plantillas
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Puedo ayudarte a crear, modificar y mejorar plantillas de email.
              Simplemente describime qué necesitás.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
              <SuggestionButton
                text="Creá una plantilla de recordatorio de pago"
                onClick={() => onSendMessage('Creá una plantilla de recordatorio de pago')}
                disabled={isLoading}
              />
              <SuggestionButton
                text="Mostrame las plantillas existentes"
                onClick={() => onSendMessage('Mostrame las plantillas existentes')}
                disabled={isLoading}
              />
              <SuggestionButton
                text="Quiero una plantilla para deuda alta con urgencia"
                onClick={() => onSendMessage('Quiero una plantilla para deuda alta con urgencia')}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Messages list */}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pensando...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message with retry */}
        {error && (
          <div className="mx-auto max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Error al procesar
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="mt-3 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reintentar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={onSendMessage}
        disabled={false}
        isLoading={isLoading}
        placeholder="Describí qué plantilla necesitás..."
      />

      {/* Clear history confirmation dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              ¿Iniciar nueva conversación?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Se perderá el historial de esta conversación y la plantilla actual.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              className="bg-segal-blue hover:bg-segal-blue/90 dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90 text-white dark:text-gray-900"
            >
              Sí, iniciar nueva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Suggestion button component
interface SuggestionButtonProps {
  text: string
  onClick: () => void
  disabled?: boolean
}

function SuggestionButton({ text, onClick, disabled }: SuggestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-left px-4 py-2.5 rounded-lg text-sm',
        'bg-gray-100 dark:bg-gray-800',
        'text-gray-700 dark:text-gray-300',
        'border border-gray-200 dark:border-gray-700',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'hover:border-segal-blue/30 dark:hover:border-segal-turquoise/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200'
      )}
    >
      {text}
    </button>
  )
}
