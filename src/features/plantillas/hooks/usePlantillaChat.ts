/**
 * Hook for managing the AI chat state for template creation/modification
 * Uses useReducer for complex state management + SSE for streaming
 */

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'
import { plantillaChatService } from '@/api/plantillaChat.service'
import type {
  ChatState,
  ChatAction,
  ChatMessage,
  TemplatePreview,
} from '../types/chat'

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ChatState = {
  messages: [],
  currentTemplate: null,
  isStreaming: false,
  isThinking: false,
  conversationId: null,
  error: null,
}

// ============================================================================
// REDUCER
// ============================================================================

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_THINKING':
      return { ...state, isThinking: action.payload, error: null }

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload }

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: 'user',
            content: action.payload.content,
            timestamp: new Date(),
          },
        ],
        error: null,
      }

    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: 'assistant',
            content: action.payload.content,
            timestamp: new Date(),
            isStreaming: true,
          },
        ],
        isThinking: false,
        isStreaming: true,
      }

    case 'UPDATE_ASSISTANT_MESSAGE': {
      const messageIndex = state.messages.findIndex(
        (m) => m.id === action.payload.id
      )
      if (messageIndex === -1) return state

      const updatedMessages = [...state.messages]
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: action.payload.content,
      }
      return { ...state, messages: updatedMessages }
    }

    case 'SET_TEMPLATE':
      return { ...state, currentTemplate: action.payload }

    case 'SET_MESSAGE_TEMPLATE': {
      const messageIndex = state.messages.findIndex(
        (m) => m.id === action.payload.id
      )
      if (messageIndex === -1) return state

      const updatedMessages = [...state.messages]
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        template: action.payload.template,
      }
      return {
        ...state,
        messages: updatedMessages,
        currentTemplate: action.payload.template,
      }
    }

    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isStreaming: false,
        isThinking: false,
      }

    case 'CLEAR_CONVERSATION':
      return {
        ...initialState,
      }

    case 'RESTORE_HISTORY':
      return {
        ...state,
        messages: action.payload.messages,
        currentTemplate: action.payload.template,
        conversationId: action.payload.conversationId,
      }

    case 'FINISH_STREAMING': {
      const messageIndex = state.messages.findIndex(
        (m) => m.id === action.payload.messageId
      )
      if (messageIndex === -1) return { ...state, isStreaming: false }

      const updatedMessages = [...state.messages]
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        isStreaming: false,
      }
      return { ...state, messages: updatedMessages, isStreaming: false }
    }

    default:
      return state
  }
}

// ============================================================================
// HOOK
// ============================================================================

export interface UsePlantillaChatOptions {
  /**
   * Whether to restore history on mount
   */
  restoreHistory?: boolean
}

export interface UsePlantillaChatReturn {
  // State
  messages: ChatMessage[]
  currentTemplate: TemplatePreview | null
  isStreaming: boolean
  isThinking: boolean
  conversationId: string | null
  error: string | null
  isLoading: boolean

  // Actions
  sendMessage: (content: string, existingTemplateId?: number) => Promise<void>
  clearHistory: () => Promise<void>
  setTemplate: (template: TemplatePreview | null) => void
  cancelRequest: () => void
  retryLastMessage: () => Promise<void>
}

export function usePlantillaChat(
  options: UsePlantillaChatOptions = {}
): UsePlantillaChatReturn {
  const { restoreHistory = true } = options

  const [state, dispatch] = useReducer(chatReducer, initialState)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentMessageIdRef = useRef<string | null>(null)
  const isLoadingHistoryRef = useRef(false)

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }, [])

  // Restore history on mount
  useEffect(() => {
    if (!restoreHistory || isLoadingHistoryRef.current) return

    const loadHistory = async () => {
      isLoadingHistoryRef.current = true
      try {
        const history = await plantillaChatService.getHistory()
        if (history && history.messages.length > 0) {
          const messages: ChatMessage[] = history.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            template: msg.template,
            timestamp: new Date(msg.timestamp),
          }))

          dispatch({
            type: 'RESTORE_HISTORY',
            payload: {
              messages,
              template: history.current_template,
              conversationId: history.conversation_id,
            },
          })
          logger.log('[usePlantillaChat] History restored:', messages.length, 'messages')
        }
      } catch (error) {
        logger.error('[usePlantillaChat] Failed to load history:', error)
        // Don't set error - just start with empty state
      } finally {
        isLoadingHistoryRef.current = false
      }
    }

    loadHistory()
  }, [restoreHistory])

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    dispatch({ type: 'SET_STREAMING', payload: false })
    dispatch({ type: 'SET_THINKING', payload: false })
  }, [])

  // Send message to agent
  const sendMessage = useCallback(
    async (content: string, existingTemplateId?: number) => {
      if (!content.trim()) return
      if (state.isStreaming || state.isThinking) return

      // Cancel any previous request
      cancelRequest()

      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Add user message
      const userMessageId = generateMessageId()
      dispatch({ type: 'ADD_USER_MESSAGE', payload: { id: userMessageId, content } })
      dispatch({ type: 'SET_THINKING', payload: true })

      // Prepare assistant message ID for streaming
      const assistantMessageId = generateMessageId()
      currentMessageIdRef.current = assistantMessageId
      let messageContent = ''

      try {
        await plantillaChatService.sendMessage(
          {
            message: content,
            conversation_id: state.conversationId || undefined,
            existing_template_id: existingTemplateId,
          },
          {
            onThinking: () => {
              logger.log('[usePlantillaChat] Agent is thinking...')
              dispatch({ type: 'SET_THINKING', payload: true })
            },
            onMessage: (chunk) => {
              // First message chunk: add assistant message
              if (!messageContent) {
                dispatch({
                  type: 'ADD_ASSISTANT_MESSAGE',
                  payload: { id: assistantMessageId, content: chunk },
                })
              } else {
                // Subsequent chunks: append to message
                dispatch({
                  type: 'UPDATE_ASSISTANT_MESSAGE',
                  payload: { id: assistantMessageId, content: messageContent + chunk },
                })
              }
              messageContent += chunk
            },
            onTemplate: (template) => {
              logger.log('[usePlantillaChat] Received template:', template.nombre)
              dispatch({
                type: 'SET_MESSAGE_TEMPLATE',
                payload: { id: assistantMessageId, template },
              })
            },
            onDone: (conversationId) => {
              logger.log('[usePlantillaChat] Stream done, conversation:', conversationId)
              dispatch({ type: 'SET_CONVERSATION_ID', payload: conversationId })
              dispatch({ type: 'FINISH_STREAMING', payload: { messageId: assistantMessageId } })
            },
            onError: (error) => {
              logger.error('[usePlantillaChat] SSE error:', error)
              dispatch({ type: 'SET_ERROR', payload: error })
            },
          },
          abortController.signal
        )
      } catch (error: any) {
        if (error.name === 'AbortError') {
          logger.log('[usePlantillaChat] Request aborted')
          return
        }

        const errorMessage = error.message || 'Error al enviar mensaje'
        logger.error('[usePlantillaChat] Send error:', errorMessage)
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
      } finally {
        abortControllerRef.current = null
        currentMessageIdRef.current = null
      }
    },
    [state.conversationId, state.isStreaming, state.isThinking, generateMessageId, cancelRequest]
  )

  // Clear history and start new conversation
  const clearHistory = useCallback(async () => {
    cancelRequest()
    
    try {
      await plantillaChatService.clearHistory()
      dispatch({ type: 'CLEAR_CONVERSATION' })
      logger.log('[usePlantillaChat] Conversation cleared')
    } catch (error) {
      logger.error('[usePlantillaChat] Failed to clear history:', error)
      // Still clear local state even if API fails
      dispatch({ type: 'CLEAR_CONVERSATION' })
    }
  }, [cancelRequest])

  // Manually set template (for external modifications)
  const setTemplate = useCallback((template: TemplatePreview | null) => {
    dispatch({ type: 'SET_TEMPLATE', payload: template })
  }, [])

  // Retry the last user message
  const retryLastMessage = useCallback(async () => {
    // Find the last user message
    const lastUserMessage = [...state.messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMessage) {
      logger.warn('[usePlantillaChat] No user message to retry')
      return
    }

    // Clear the error
    dispatch({ type: 'SET_ERROR', payload: null })

    // Remove the last assistant message if it exists (failed response)
    const lastMessage = state.messages[state.messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      // We don't have a REMOVE_MESSAGE action, but we can clear error and resend
      // The new message will be added after the existing ones
    }

    logger.log('[usePlantillaChat] Retrying message:', lastUserMessage.content)
    await sendMessage(lastUserMessage.content)
  }, [state.messages, sendMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    messages: state.messages,
    currentTemplate: state.currentTemplate,
    isStreaming: state.isStreaming,
    isThinking: state.isThinking,
    conversationId: state.conversationId,
    error: state.error,
    isLoading: state.isStreaming || state.isThinking,

    // Actions
    sendMessage,
    clearHistory,
    setTemplate,
    cancelRequest,
    retryLastMessage,
  }
}
