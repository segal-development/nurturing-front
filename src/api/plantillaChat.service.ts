/**
 * Service for AI-powered template chat feature
 * Handles SSE streaming for real-time agent responses
 */

import { apiClient } from './client'
import { logger } from '@/lib/logger'
import type {
  SendMessageRequest,
  SaveTemplateRequest,
  SaveTemplateResponse,
  ChatHistoryResponse,
  SSEEvent,
  SSECallbacks,
  TemplatePreview,
} from '@/features/plantillas/types/chat'
import type { AnyEmailComponent } from '@/types/plantilla'

// ============================================================================
// SSE PARSING UTILITIES
// ============================================================================

/**
 * Parse a single SSE data line into a typed event
 * Format: data: {"type": "...", "content": ...}
 */
function parseSSELine(line: string): SSEEvent | null {
  // SSE lines start with "data: "
  if (!line.startsWith('data: ')) {
    return null
  }

  const jsonStr = line.slice(6) // Remove "data: " prefix
  
  // Handle special cases
  if (jsonStr === '[DONE]' || jsonStr.trim() === '') {
    return null
  }

  try {
    const parsed = JSON.parse(jsonStr)
    
    // Validate event type
    if (!parsed.type) {
      logger.warn('[SSE] Event missing type:', parsed)
      return null
    }

    switch (parsed.type) {
      case 'thinking':
        return { type: 'thinking', content: parsed.content || '' }
      
      case 'message':
        return { type: 'message', content: parsed.content || '' }
      
      case 'template':
        // Parse and deserialize template components
        const template = deserializeTemplateComponents(parsed.content)
        return { type: 'template', content: template }
      
      case 'done':
        return { type: 'done', conversation_id: parsed.conversation_id || '' }
      
      case 'error':
        return { type: 'error', content: parsed.content || 'Unknown error' }
      
      default:
        logger.warn('[SSE] Unknown event type:', parsed.type)
        return null
    }
  } catch (error) {
    logger.warn('[SSE] Failed to parse line:', line, error)
    return null
  }
}

/**
 * Deserialize template components from backend format
 * Backend sends contenido as JSON strings, we need objects
 */
function deserializeTemplateComponents(template: TemplatePreview): TemplatePreview {
  if (!template || !template.componentes) {
    return template
  }

  return {
    ...template,
    componentes: template.componentes.map((comp) => ({
      ...comp,
      contenido: typeof comp.contenido === 'string'
        ? safeJsonParse(comp.contenido, comp.contenido as unknown)
        : comp.contenido,
    })) as AnyEmailComponent[],
  }
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

/**
 * Process SSE stream with callbacks
 */
async function processSSEStream(
  response: Response,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      // Check if aborted
      if (signal?.aborted) {
        reader.cancel()
        break
      }

      const { done, value } = await reader.read()
      
      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              const event = parseSSELine(line.trim())
              if (event) {
                dispatchSSEEvent(event, callbacks)
              }
            }
          }
        }
        break
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete lines
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine) {
          const event = parseSSELine(trimmedLine)
          if (event) {
            dispatchSSEEvent(event, callbacks)
          }
        }
      }
    }
  } catch (error: unknown) {
    // Handle connection errors gracefully
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw error // Re-throw abort errors to be handled by caller
      }
      // Network/connection error
      callbacks.onError?.(`Error de conexión: ${error.message}`)
    } else {
      callbacks.onError?.('Error de conexión desconocido')
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Dispatch SSE event to appropriate callback
 */
function dispatchSSEEvent(event: SSEEvent, callbacks: SSECallbacks): void {
  switch (event.type) {
    case 'thinking':
      callbacks.onThinking?.(event.content)
      break
    case 'message':
      callbacks.onMessage?.(event.content)
      break
    case 'template':
      callbacks.onTemplate?.(event.content)
      break
    case 'done':
      callbacks.onDone?.(event.conversation_id)
      break
    case 'error':
      callbacks.onError?.(event.content)
      break
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export const plantillaChatService = {
  /**
   * Send a message to the AI agent and receive SSE stream
   * Uses fetch directly for SSE support (axios doesn't handle streaming well)
   */
  async sendMessage(
    request: SendMessageRequest,
    callbacks: SSECallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const url = `${baseURL}/plantilla-chat/message`

    logger.log('[plantillaChatService.sendMessage] Starting SSE request')

    // Get XSRF token from cookie for Sanctum auth
    const xsrfToken = getXsrfToken()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
      },
      credentials: 'include', // Important for Sanctum session auth
      body: JSON.stringify(request),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }

    // Check if response is SSE
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/event-stream')) {
      // Fallback: parse as JSON response
      const json = await response.json()
      if (json.message) {
        callbacks.onMessage?.(json.message)
      }
      if (json.template) {
        callbacks.onTemplate?.(deserializeTemplateComponents(json.template))
      }
      if (json.conversation_id) {
        callbacks.onDone?.(json.conversation_id)
      }
      return
    }

    // Process SSE stream
    await processSSEStream(response, callbacks, signal)
  },

  /**
   * Save or update a template
   */
  async saveTemplate(request: SaveTemplateRequest): Promise<SaveTemplateResponse> {
    try {
      logger.log('[plantillaChatService.saveTemplate] Saving template')
      
      // Serialize components for backend
      const serializedTemplate = {
        ...request.template,
        componentes: request.template.componentes.map((comp) => ({
          ...comp,
          contenido: typeof comp.contenido === 'string'
            ? comp.contenido
            : JSON.stringify(comp.contenido),
        })),
      }

      const response = await apiClient.post<SaveTemplateResponse>('/plantilla-chat/save', {
        template: serializedTemplate,
        nombre: request.nombre,
        descripcion: request.descripcion,
        existing_id: request.existing_id,
      })

      logger.log('[plantillaChatService.saveTemplate] Template saved:', response.data)
      return response.data
    } catch (error: any) {
      logger.error('[plantillaChatService.saveTemplate] Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Get conversation history for the authenticated user
   */
  async getHistory(): Promise<ChatHistoryResponse | null> {
    try {
      logger.log('[plantillaChatService.getHistory] Fetching history')
      
      const response = await apiClient.get<ChatHistoryResponse>('/plantilla-chat/history')
      
      // Deserialize template if present
      if (response.data.current_template) {
        response.data.current_template = deserializeTemplateComponents(response.data.current_template)
      }

      // Deserialize templates in messages
      response.data.messages = response.data.messages.map((msg) => ({
        ...msg,
        template: msg.template ? deserializeTemplateComponents(msg.template) : null,
      }))

      logger.log('[plantillaChatService.getHistory] History loaded:', response.data.messages.length, 'messages')
      return response.data
    } catch (error: any) {
      // 404 means no conversation exists yet - not an error
      if (error.response?.status === 404) {
        logger.log('[plantillaChatService.getHistory] No history found')
        return null
      }
      
      logger.error('[plantillaChatService.getHistory] Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },

  /**
   * Clear conversation history (start new conversation)
   */
  async clearHistory(): Promise<void> {
    try {
      logger.log('[plantillaChatService.clearHistory] Clearing history')
      
      await apiClient.delete('/plantilla-chat/history')
      
      logger.log('[plantillaChatService.clearHistory] History cleared')
    } catch (error: any) {
      logger.error('[plantillaChatService.clearHistory] Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },
}

/**
 * Extract XSRF token from cookie (for Sanctum auth)
 */
function getXsrfToken(): string | null {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value)
    }
  }
  return null
}
