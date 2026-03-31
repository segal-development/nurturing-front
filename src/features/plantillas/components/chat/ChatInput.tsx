/**
 * Chat input component with textarea
 * Enter to send, Shift+Enter for newline
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Escribí tu mensaje...',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to calculate proper scrollHeight
    textarea.style.height = 'auto'
    // Set new height, capped at max
    const newHeight = Math.min(textarea.scrollHeight, 150)
    textarea.style.height = `${newHeight}px`
  }, [])

  // Adjust height on value change
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Handle send
  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isLoading) return

    onSend(trimmed)
    setValue('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, isLoading, onSend])

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without Shift sends the message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const canSend = value.trim().length > 0 && !disabled && !isLoading

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'w-full resize-none rounded-xl px-4 py-3 pr-12',
            'text-sm text-gray-900 dark:text-gray-100',
            'bg-gray-100 dark:bg-gray-800',
            'border border-transparent',
            'focus:outline-none focus:ring-2 focus:ring-segal-blue/20 dark:focus:ring-segal-turquoise/20',
            'focus:border-segal-blue dark:focus:border-segal-turquoise',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
          style={{ minHeight: '48px', maxHeight: '150px' }}
        />

        {/* Character hint */}
        <span className="absolute right-3 bottom-2 text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none">
          Enter enviar
        </span>
      </div>

      <Button
        onClick={handleSend}
        disabled={!canSend}
        size="icon"
        className={cn(
          'h-12 w-12 rounded-xl flex-shrink-0',
          'bg-segal-blue hover:bg-segal-blue/90',
          'dark:bg-segal-turquoise dark:hover:bg-segal-turquoise/90',
          'text-white dark:text-gray-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}
