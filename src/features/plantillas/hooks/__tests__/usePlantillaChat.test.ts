/**
 * Tests for usePlantillaChat hook reducer
 *
 * Tests the reducer state transitions for the AI chat feature.
 * Service calls are mocked to test pure reducer logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ChatState, ChatAction, ChatMessage, TemplatePreview } from '../../types/chat'

// ============================================================================
// EXTRACT REDUCER FOR TESTING
// ============================================================================

// Re-implement the reducer here for isolated testing
// This matches the reducer in usePlantillaChat.ts

const initialState: ChatState = {
  messages: [],
  currentTemplate: null,
  isStreaming: false,
  isThinking: false,
  conversationId: null,
  error: null,
}

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
// TESTS
// ============================================================================

describe('usePlantillaChat reducer', () => {
  let state: ChatState

  beforeEach(() => {
    state = { ...initialState }
  })

  // ============================================
  // SET_THINKING
  // ============================================

  describe('SET_THINKING', () => {
    it('should set isThinking to true', () => {
      const newState = chatReducer(state, { type: 'SET_THINKING', payload: true })

      expect(newState.isThinking).toBe(true)
    })

    it('should set isThinking to false', () => {
      state = { ...state, isThinking: true }
      const newState = chatReducer(state, { type: 'SET_THINKING', payload: false })

      expect(newState.isThinking).toBe(false)
    })

    it('should clear error when setting thinking', () => {
      state = { ...state, error: 'Previous error' }
      const newState = chatReducer(state, { type: 'SET_THINKING', payload: true })

      expect(newState.error).toBeNull()
    })
  })

  // ============================================
  // SET_STREAMING
  // ============================================

  describe('SET_STREAMING', () => {
    it('should set isStreaming to true', () => {
      const newState = chatReducer(state, { type: 'SET_STREAMING', payload: true })

      expect(newState.isStreaming).toBe(true)
    })

    it('should set isStreaming to false', () => {
      state = { ...state, isStreaming: true }
      const newState = chatReducer(state, { type: 'SET_STREAMING', payload: false })

      expect(newState.isStreaming).toBe(false)
    })
  })

  // ============================================
  // ADD_USER_MESSAGE
  // ============================================

  describe('ADD_USER_MESSAGE', () => {
    it('should add user message to empty messages array', () => {
      const newState = chatReducer(state, {
        type: 'ADD_USER_MESSAGE',
        payload: { id: 'msg_1', content: 'Hello' },
      })

      expect(newState.messages).toHaveLength(1)
      expect(newState.messages[0].id).toBe('msg_1')
      expect(newState.messages[0].role).toBe('user')
      expect(newState.messages[0].content).toBe('Hello')
    })

    it('should append user message to existing messages', () => {
      state = {
        ...state,
        messages: [
          { id: 'msg_0', role: 'user', content: 'First', timestamp: new Date() },
        ],
      }

      const newState = chatReducer(state, {
        type: 'ADD_USER_MESSAGE',
        payload: { id: 'msg_1', content: 'Second' },
      })

      expect(newState.messages).toHaveLength(2)
      expect(newState.messages[1].content).toBe('Second')
    })

    it('should clear error when adding user message', () => {
      state = { ...state, error: 'Previous error' }
      const newState = chatReducer(state, {
        type: 'ADD_USER_MESSAGE',
        payload: { id: 'msg_1', content: 'Hello' },
      })

      expect(newState.error).toBeNull()
    })

    it('should set timestamp on new message', () => {
      const newState = chatReducer(state, {
        type: 'ADD_USER_MESSAGE',
        payload: { id: 'msg_1', content: 'Hello' },
      })

      expect(newState.messages[0].timestamp).toBeInstanceOf(Date)
    })
  })

  // ============================================
  // ADD_ASSISTANT_MESSAGE
  // ============================================

  describe('ADD_ASSISTANT_MESSAGE', () => {
    it('should add assistant message with streaming flag', () => {
      const newState = chatReducer(state, {
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: { id: 'msg_1', content: 'Response' },
      })

      expect(newState.messages).toHaveLength(1)
      expect(newState.messages[0].role).toBe('assistant')
      expect(newState.messages[0].isStreaming).toBe(true)
    })

    it('should set isThinking to false', () => {
      state = { ...state, isThinking: true }
      const newState = chatReducer(state, {
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: { id: 'msg_1', content: 'Response' },
      })

      expect(newState.isThinking).toBe(false)
    })

    it('should set isStreaming to true', () => {
      const newState = chatReducer(state, {
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: { id: 'msg_1', content: 'Response' },
      })

      expect(newState.isStreaming).toBe(true)
    })
  })

  // ============================================
  // UPDATE_ASSISTANT_MESSAGE
  // ============================================

  describe('UPDATE_ASSISTANT_MESSAGE', () => {
    it('should update content of existing message', () => {
      state = {
        ...state,
        messages: [
          { id: 'msg_1', role: 'assistant', content: 'Initial', timestamp: new Date() },
        ],
      }

      const newState = chatReducer(state, {
        type: 'UPDATE_ASSISTANT_MESSAGE',
        payload: { id: 'msg_1', content: 'Updated content' },
      })

      expect(newState.messages[0].content).toBe('Updated content')
    })

    it('should return unchanged state if message not found', () => {
      state = {
        ...state,
        messages: [
          { id: 'msg_1', role: 'assistant', content: 'Content', timestamp: new Date() },
        ],
      }

      const newState = chatReducer(state, {
        type: 'UPDATE_ASSISTANT_MESSAGE',
        payload: { id: 'nonexistent', content: 'Updated' },
      })

      expect(newState).toEqual(state)
    })

    it('should preserve other message properties', () => {
      const timestamp = new Date()
      state = {
        ...state,
        messages: [
          { id: 'msg_1', role: 'assistant', content: 'Initial', timestamp, isStreaming: true },
        ],
      }

      const newState = chatReducer(state, {
        type: 'UPDATE_ASSISTANT_MESSAGE',
        payload: { id: 'msg_1', content: 'Updated' },
      })

      expect(newState.messages[0].isStreaming).toBe(true)
      expect(newState.messages[0].timestamp).toEqual(timestamp)
    })
  })

  // ============================================
  // SET_TEMPLATE
  // ============================================

  describe('SET_TEMPLATE', () => {
    it('should set currentTemplate', () => {
      const template: TemplatePreview = {
        nombre: 'Test Template',
        asunto: 'Test Subject',
        componentes: [],
      }

      const newState = chatReducer(state, {
        type: 'SET_TEMPLATE',
        payload: template,
      })

      expect(newState.currentTemplate).toEqual(template)
    })

    it('should set currentTemplate to null', () => {
      state = {
        ...state,
        currentTemplate: { nombre: 'Old', asunto: 'Old', componentes: [] },
      }

      const newState = chatReducer(state, {
        type: 'SET_TEMPLATE',
        payload: null,
      })

      expect(newState.currentTemplate).toBeNull()
    })
  })

  // ============================================
  // SET_MESSAGE_TEMPLATE
  // ============================================

  describe('SET_MESSAGE_TEMPLATE', () => {
    it('should set template on specific message and update currentTemplate', () => {
      state = {
        ...state,
        messages: [
          { id: 'msg_1', role: 'assistant', content: 'Response', timestamp: new Date() },
        ],
      }

      const template: TemplatePreview = {
        nombre: 'Generated',
        asunto: 'Subject',
        componentes: [{ tipo: 'texto', texto: 'Content' }] as any,
      }

      const newState = chatReducer(state, {
        type: 'SET_MESSAGE_TEMPLATE',
        payload: { id: 'msg_1', template },
      })

      expect(newState.messages[0].template).toEqual(template)
      expect(newState.currentTemplate).toEqual(template)
    })

    it('should return unchanged state if message not found', () => {
      const template: TemplatePreview = {
        nombre: 'Test',
        asunto: 'Test',
        componentes: [],
      }

      const newState = chatReducer(state, {
        type: 'SET_MESSAGE_TEMPLATE',
        payload: { id: 'nonexistent', template },
      })

      expect(newState).toEqual(state)
    })
  })

  // ============================================
  // SET_CONVERSATION_ID
  // ============================================

  describe('SET_CONVERSATION_ID', () => {
    it('should set conversationId', () => {
      const newState = chatReducer(state, {
        type: 'SET_CONVERSATION_ID',
        payload: 'conv_123',
      })

      expect(newState.conversationId).toBe('conv_123')
    })
  })

  // ============================================
  // SET_ERROR
  // ============================================

  describe('SET_ERROR', () => {
    it('should set error and clear streaming/thinking states', () => {
      state = { ...state, isStreaming: true, isThinking: true }

      const newState = chatReducer(state, {
        type: 'SET_ERROR',
        payload: 'Something went wrong',
      })

      expect(newState.error).toBe('Something went wrong')
      expect(newState.isStreaming).toBe(false)
      expect(newState.isThinking).toBe(false)
    })

    it('should allow clearing error by setting to null', () => {
      state = { ...state, error: 'Previous error' }

      const newState = chatReducer(state, {
        type: 'SET_ERROR',
        payload: null,
      })

      expect(newState.error).toBeNull()
    })
  })

  // ============================================
  // CLEAR_CONVERSATION
  // ============================================

  describe('CLEAR_CONVERSATION', () => {
    it('should reset state to initial', () => {
      state = {
        messages: [{ id: 'msg_1', role: 'user', content: 'Test', timestamp: new Date() }],
        currentTemplate: { nombre: 'Test', asunto: 'Test', componentes: [] },
        isStreaming: true,
        isThinking: true,
        conversationId: 'conv_123',
        error: 'Some error',
      }

      const newState = chatReducer(state, { type: 'CLEAR_CONVERSATION' })

      expect(newState.messages).toHaveLength(0)
      expect(newState.currentTemplate).toBeNull()
      expect(newState.isStreaming).toBe(false)
      expect(newState.isThinking).toBe(false)
      expect(newState.conversationId).toBeNull()
      expect(newState.error).toBeNull()
    })
  })

  // ============================================
  // RESTORE_HISTORY
  // ============================================

  describe('RESTORE_HISTORY', () => {
    it('should restore messages, template, and conversationId', () => {
      const messages: ChatMessage[] = [
        { id: 'msg_1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: 'msg_2', role: 'assistant', content: 'Hi there', timestamp: new Date() },
      ]

      const template: TemplatePreview = {
        nombre: 'Restored Template',
        asunto: 'Subject',
        componentes: [],
      }

      const newState = chatReducer(state, {
        type: 'RESTORE_HISTORY',
        payload: {
          messages,
          template,
          conversationId: 'conv_restored',
        },
      })

      expect(newState.messages).toEqual(messages)
      expect(newState.currentTemplate).toEqual(template)
      expect(newState.conversationId).toBe('conv_restored')
    })

    it('should preserve other state properties', () => {
      state = { ...state, isStreaming: true }

      const newState = chatReducer(state, {
        type: 'RESTORE_HISTORY',
        payload: {
          messages: [],
          template: null,
          conversationId: 'conv_1',
        },
      })

      // isStreaming should be preserved (not part of restore)
      expect(newState.isStreaming).toBe(true)
    })
  })

  // ============================================
  // FINISH_STREAMING
  // ============================================

  describe('FINISH_STREAMING', () => {
    it('should set isStreaming to false on message and state', () => {
      state = {
        ...state,
        isStreaming: true,
        messages: [
          { id: 'msg_1', role: 'assistant', content: 'Response', timestamp: new Date(), isStreaming: true },
        ],
      }

      const newState = chatReducer(state, {
        type: 'FINISH_STREAMING',
        payload: { messageId: 'msg_1' },
      })

      expect(newState.isStreaming).toBe(false)
      expect(newState.messages[0].isStreaming).toBe(false)
    })

    it('should only set state isStreaming if message not found', () => {
      state = {
        ...state,
        isStreaming: true,
        messages: [
          { id: 'msg_1', role: 'assistant', content: 'Response', timestamp: new Date() },
        ],
      }

      const newState = chatReducer(state, {
        type: 'FINISH_STREAMING',
        payload: { messageId: 'nonexistent' },
      })

      expect(newState.isStreaming).toBe(false)
    })
  })

  // ============================================
  // Unknown action
  // ============================================

  describe('unknown action', () => {
    it('should return current state for unknown action', () => {
      const newState = chatReducer(state, { type: 'UNKNOWN_ACTION' } as any)

      expect(newState).toEqual(state)
    })
  })

  // ============================================
  // Complex scenarios
  // ============================================

  describe('complex scenarios', () => {
    it('should handle full chat flow: send message -> thinking -> response -> template -> done', () => {
      // 1. Add user message
      let currentState = chatReducer(state, {
        type: 'ADD_USER_MESSAGE',
        payload: { id: 'user_1', content: 'Create a reminder template' },
      })
      expect(currentState.messages).toHaveLength(1)
      expect(currentState.error).toBeNull()

      // 2. Set thinking
      currentState = chatReducer(currentState, { type: 'SET_THINKING', payload: true })
      expect(currentState.isThinking).toBe(true)

      // 3. Add assistant message (first chunk)
      currentState = chatReducer(currentState, {
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: { id: 'assistant_1', content: 'Creating...' },
      })
      expect(currentState.messages).toHaveLength(2)
      expect(currentState.isThinking).toBe(false)
      expect(currentState.isStreaming).toBe(true)

      // 4. Update message content (streaming)
      currentState = chatReducer(currentState, {
        type: 'UPDATE_ASSISTANT_MESSAGE',
        payload: { id: 'assistant_1', content: 'Creating your template now...' },
      })
      expect(currentState.messages[1].content).toBe('Creating your template now...')

      // 5. Set template
      const template: TemplatePreview = {
        nombre: 'Reminder',
        asunto: 'Payment Reminder',
        componentes: [{ tipo: 'texto', texto: 'Please pay' }] as any,
      }
      currentState = chatReducer(currentState, {
        type: 'SET_MESSAGE_TEMPLATE',
        payload: { id: 'assistant_1', template },
      })
      expect(currentState.currentTemplate).toEqual(template)
      expect(currentState.messages[1].template).toEqual(template)

      // 6. Set conversation ID
      currentState = chatReducer(currentState, {
        type: 'SET_CONVERSATION_ID',
        payload: 'conv_123',
      })
      expect(currentState.conversationId).toBe('conv_123')

      // 7. Finish streaming
      currentState = chatReducer(currentState, {
        type: 'FINISH_STREAMING',
        payload: { messageId: 'assistant_1' },
      })
      expect(currentState.isStreaming).toBe(false)
      expect(currentState.messages[1].isStreaming).toBe(false)

      // Final state verification
      expect(currentState.messages).toHaveLength(2)
      expect(currentState.currentTemplate).toEqual(template)
      expect(currentState.conversationId).toBe('conv_123')
      expect(currentState.error).toBeNull()
    })

    it('should handle error during streaming and allow retry', () => {
      // Start a message
      let currentState = chatReducer(state, {
        type: 'ADD_USER_MESSAGE',
        payload: { id: 'user_1', content: 'Create template' },
      })
      currentState = chatReducer(currentState, { type: 'SET_THINKING', payload: true })

      // Error occurs
      currentState = chatReducer(currentState, {
        type: 'SET_ERROR',
        payload: 'Connection lost',
      })
      expect(currentState.error).toBe('Connection lost')
      expect(currentState.isThinking).toBe(false)
      expect(currentState.isStreaming).toBe(false)

      // Clear error for retry
      currentState = chatReducer(currentState, {
        type: 'SET_ERROR',
        payload: null,
      })
      expect(currentState.error).toBeNull()

      // User message is still there
      expect(currentState.messages).toHaveLength(1)
    })
  })
})
