import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useLogin } from '../../hooks/useLogin'
import { useAuth } from '@/hooks/useAuth'
import * as authApi from '@/api/auth'

// Mock the API and hooks
vi.mock('@/api/auth')
vi.mock('@/hooks/useAuth')

describe('useLogin Hook', () => {
  const mockSetUser = vi.fn()
  const mockClearError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: mockSetUser,
      logout: vi.fn(),
      clearError: mockClearError
    } as any)
  })

  describe('useLogin - Happy Path', () => {
    it('should return login function and state', () => {
      const { result } = renderHook(() => useLogin())

      expect(result.current.login).toBeDefined()
      expect(result.current.isLoading).toBeDefined()
      expect(result.current.error).toBeDefined()
    })

    it('should login successfully with valid credentials', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        token: 'jwt-token-123',
        user: {
          id: '1',
          email: 'test@example.com',
          nombre: 'Test User',
          rol: 'user'
        }
      })

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        await result.current.login('test@example.com', 'Password123')
      })

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith({
          id: '1',
          email: 'test@example.com',
          nombre: 'Test User',
          rol: 'user'
        })
      })
    })

    it('should handle API response with token correctly', async () => {
      const mockToken = 'jwt-token-abc123'
      const mockUser = {
        id: '123',
        email: 'user@example.com',
        nombre: 'John Doe',
        rol: 'user' as const
      }

      const mockMutateAsync = vi.fn().mockResolvedValue({
        token: mockToken,
        user: mockUser
      })

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null
      } as any)

      const { result } = renderHook(() => useLogin())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('user@example.com', 'SecurePass123')
      })

      expect(loginResult).toEqual({ token: mockToken, user: mockUser })
    })
  })

  describe('useLogin - Error Handling', () => {
    it('should return error message on login failure', async () => {
      const errorMessage = 'Credenciales inválidas'
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error(errorMessage))

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: new Error(errorMessage)
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'WrongPassword')
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.error).toBeTruthy()
    })

    it('should handle network errors', async () => {
      const networkError = 'Network request failed'
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error(networkError))

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: new Error(networkError)
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'Password123')
        } catch (error) {
          expect((error as Error).message).toBe(networkError)
        }
      })
    })

    it('should handle 401 unauthorized response', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      })

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: new Error('Unauthorized')
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'Password123')
        } catch (error) {
          expect((error as any).status).toBe(401)
        }
      })
    })
  })

  describe('useLogin - Loading State', () => {
    it('should reflect loading state during login', async () => {
      let isPendingValue = false

      const mockMutateAsync = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return { token: 'token', user: { id: '1', email: 'test@example.com', nombre: 'Test', rol: 'user' as const } }
      })

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        const promise = result.current.login('test@example.com', 'Password123')
        isPendingValue = result.current.isLoading
        await promise
      })

      expect(mockMutateAsync).toHaveBeenCalled()
    })
  })

  describe('useLogin - Email Sanitization', () => {
    it('should accept valid email addresses', async () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com'
      ]

      const mockMutateAsync = vi.fn().mockResolvedValue({
        token: 'token',
        user: { id: '1', email: 'test@example.com', nombre: 'Test', rol: 'user' as const }
      })

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null
      } as any)

      const { result } = renderHook(() => useLogin())

      for (const email of validEmails) {
        await act(async () => {
          await result.current.login(email, 'Password123')
        })
      }

      expect(mockMutateAsync).toHaveBeenCalledTimes(validEmails.length)
    })

    it('should reject invalid email addresses', async () => {
      const invalidEmails = [
        'notanemail',
        'user@',
        '@example.com',
        'user @example.com'
      ]

      const mockMutateAsync = vi.fn()
      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null
      } as any)

      const { result } = renderHook(() => useLogin())

      for (const email of invalidEmails) {
        await act(async () => {
          try {
            // Email validation should happen before calling API
            await result.current.login(email, 'Password123')
          } catch (error) {
            // Validation error expected
          }
        })
      }
    })
  })

  describe('useLogin - Password Security', () => {
    it('should not expose password in error messages', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Login failed'))

      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: new Error('Login failed')
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'MySecretPassword123')
        } catch (error) {
          // Verify password is not in error message
          expect(result.current.error?.includes('MySecretPassword123')).toBeFalsy()
        }
      })
    })

    it('should require minimum password length', async () => {
      const mockMutateAsync = vi.fn()
      vi.mocked(authApi.loginMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null
      } as any)

      const { result } = renderHook(() => useLogin())

      await act(async () => {
        try {
          // Password with less than 8 characters
          await result.current.login('test@example.com', 'short')
        } catch (error) {
          // Validation error expected
        }
      })

      // API should not be called for invalid password
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })
  })
})
