/**
 * Single chat message bubble component
 * Displays user messages on the right (blue) and agent messages on the left (gray)
 */

import { useMemo } from 'react'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  // Format timestamp
  const formattedTime = useMemo(() => {
    return message.timestamp.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [message.timestamp])

  return (
    <div
      className={cn(
        'flex gap-3 max-w-[85%]',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-segal-blue dark:bg-segal-turquoise'
            : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white dark:text-gray-900" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
      </div>

      {/* Message bubble */}
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 shadow-sm',
            isUser
              ? 'bg-segal-blue dark:bg-segal-turquoise text-white dark:text-gray-900 rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700'
          )}
        >
          {/* Message content */}
          <p
            className={cn(
              'text-sm whitespace-pre-wrap break-words',
              message.isStreaming && 'animate-pulse'
            )}
          >
            {message.content}
            {message.isStreaming && (
              <span className="inline-block ml-1 animate-pulse">...</span>
            )}
          </p>

          {/* Template indicator */}
          {message.template && !isUser && (
            <div
              className={cn(
                'mt-2 pt-2 border-t text-xs flex items-center gap-1.5',
                'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              )}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              Plantilla generada: {message.template.nombre || 'Sin nombre'}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={cn(
            'text-[10px] text-gray-400 dark:text-gray-500',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {formattedTime}
        </span>
      </div>
    </div>
  )
}
