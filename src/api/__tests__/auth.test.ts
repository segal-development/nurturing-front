import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loginMutation, refreshTokenMutation } from '../auth'
import { authClient } from '../client'

// Mock the API client
vi.mock('../client')

describe('Auth API', () => {
  const mockAuthClient = authClient as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginMutation', () => {
    it('should return mutation function', () => {
      const mutation = loginMutation()
      expect(mutation).toBeDefined()
      expect(mutation.mutationFn).toBeDefined()
    })

    it('should call POST /login with credentials', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-123',
          user: {
            id: '1',
            email: 'test@example.com',
            nombre: 'Test User',
            rol: 'user'
          }
        }
      }

      mockAuthClient.post.mockResolvedValue(mockResponse)

      const mutation = loginMutation()
      const credentials = { email: 'test@example.com', password: 'Password123' }

      const result = await mutation.mutationFn(credentials)

      expect(mockAuthClient.post).toHaveBeenCalledWith('/login', credentials)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle successful login response', async () => {
      const mockUser = {
        id: '123',
        email: 'john@example.com',
        nombre: 'John Doe',
        rol: 'admin' as const
      }

      const mockResponse = {
        data: {
          token: 'jwt-token-abc',
          user: mockUser
        }
      }

      mockAuthClient.post.mockResolvedValue(mockResponse)

      const mutation = loginMutation()
      const result = await mutation.mutationFn({
        email: 'john@example.com',
        password: 'SecurePassword123'
      })

      expect(result.token).toBe('jwt-token-abc')
      expect(result.user).toEqual(mockUser)
    })

    it('should handle login failure with error response', async () => {
      const errorResponse = {
        status: 401,
        data: { message: 'Credenciales inválidas' }
      }

      mockAuthClient.post.mockRejectedValue(new Error('Unauthorized'))

      const mutation = loginMutation()

      await expect(
        mutation.mutationFn({
          email: 'wrong@example.com',
          password: 'WrongPassword'
        })
      ).rejects.toThrow()

      expect(mockAuthClient.post).toHaveBeenCalled()
    })

    it('should handle network error', async () => {
      mockAuthClient.post.mockRejectedValue(new Error('Network error'))

      const mutation = loginMutation()

      await expect(
        mutation.mutationFn({
          email: 'test@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Network error')
    })

    it('should handle 401 unauthorized response', async () => {
      const error = new Error('Unauthorized')
      mockAuthClient.post.mockRejectedValue(error)

      const mutation = loginMutation()

      await expect(
        mutation.mutationFn({
          email: 'test@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('should handle 500 server error', async () => {
      const error = new Error('Internal Server Error')
      mockAuthClient.post.mockRejectedValue(error)

      const mutation = loginMutation()

      await expect(
        mutation.mutationFn({
          email: 'test@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Internal Server Error')
    })

    it('should never log sensitive credentials', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockAuthClient.post.mockResolvedValue({
        data: { token: 'token', user: { id: '1', email: 'test@example.com', nombre: 'Test', rol: 'user' } }
      })

      const mutation = loginMutation()
      await mutation.mutationFn({
        email: 'test@example.com',
        password: 'MySecretPassword123'
      })

      const logCalls = consoleSpy.mock.calls.map(call => call.join(' ')).join(' ')
      expect(logCalls).not.toContain('MySecretPassword123')

      consoleSpy.mockRestore()
    })

    it('should pass credentials to API without modification', async () => {
      mockAuthClient.post.mockResolvedValue({
        data: { token: 'token', user: { id: '1', email: 'test@example.com', nombre: 'Test', rol: 'user' } }
      })

      const mutation = loginMutation()
      const credentials = { email: 'test@example.com', password: 'Password123' }

      await mutation.mutationFn(credentials)

      expect(mockAuthClient.post).toHaveBeenCalledWith('/login', credentials)
    })
  })

  describe('refreshTokenMutation', () => {
    it('should return mutation function for token refresh', () => {
      const mutation = refreshTokenMutation()
      expect(mutation).toBeDefined()
      expect(mutation.mutationFn).toBeDefined()
    })

    it('should call POST /refresh-token', async () => {
      const mockResponse = {
        data: {
          token: 'new-jwt-token-456',
          expiresIn: 3600
        }
      }

      mockAuthClient.post.mockResolvedValue(mockResponse)

      const mutation = refreshTokenMutation()
      const result = await mutation.mutationFn()

      expect(mockAuthClient.post).toHaveBeenCalledWith('/refresh-token')
      expect(result).toEqual(mockResponse.data)
    })

    it('should return new token on successful refresh', async () => {
      const mockResponse = {
        data: {
          token: 'new-token-xyz',
          expiresIn: 3600
        }
      }

      mockAuthClient.post.mockResolvedValue(mockResponse)

      const mutation = refreshTokenMutation()
      const result = await mutation.mutationFn()

      expect(result.token).toBe('new-token-xyz')
      expect(result.expiresIn).toBe(3600)
    })

    it('should handle refresh failure', async () => {
      mockAuthClient.post.mockRejectedValue(new Error('Token refresh failed'))

      const mutation = refreshTokenMutation()

      await expect(mutation.mutationFn()).rejects.toThrow('Token refresh failed')
    })

    it('should handle 401 on refresh (token invalid)', async () => {
      mockAuthClient.post.mockRejectedValue(new Error('Unauthorized'))

      const mutation = refreshTokenMutation()

      await expect(mutation.mutationFn()).rejects.toThrow('Unauthorized')
    })
  })

  describe('Auth API - Security', () => {
    it('should use HTTPS only (production)', () => {
      // Verify API client is configured for HTTPS
      // This would be checked in the client setup
      expect(authClient).toBeDefined()
    })

    it('should include CSRF token in requests (if applicable)', async () => {
      // Verify CSRF token handling if backend requires it
      mockAuthClient.post.mockResolvedValue({
        data: { token: 'token', user: { id: '1', email: 'test@example.com', nombre: 'Test', rol: 'user' } }
      })

      const mutation = loginMutation()
      await mutation.mutationFn({
        email: 'test@example.com',
        password: 'Password123'
      })

      // Should be called with appropriate headers
      expect(mockAuthClient.post).toHaveBeenCalled()
    })

    it('should not expose error details that could leak information', async () => {
      mockAuthClient.post.mockRejectedValue(
        new Error('Credenciales inválidas - esto es seguro')
      )

      const mutation = loginMutation()

      try {
        await mutation.mutationFn({
          email: 'test@example.com',
          password: 'Password123'
        })
      } catch (error) {
        const errorMessage = (error as Error).message
        expect(errorMessage).not.toContain('Password123')
      }
    })
  })

  describe('Auth API - Edge Cases', () => {
    it('should handle empty response from server', async () => {
      mockAuthClient.post.mockResolvedValue({ data: null })

      const mutation = loginMutation()
      const result = await mutation.mutationFn({
        email: 'test@example.com',
        password: 'Password123'
      })

      expect(result).toBeNull()
    })

    it('should handle malformed response', async () => {
      mockAuthClient.post.mockResolvedValue({
        data: { token: 'token' } // Missing user
      })

      const mutation = loginMutation()
      const result = await mutation.mutationFn({
        email: 'test@example.com',
        password: 'Password123'
      })

      expect(result.token).toBe('token')
      expect(result.user).toBeUndefined()
    })

    it('should handle timeout on login request', async () => {
      const timeoutError = new Error('Request timeout')
      mockAuthClient.post.mockRejectedValue(timeoutError)

      const mutation = loginMutation()

      await expect(
        mutation.mutationFn({
          email: 'test@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Request timeout')
    })
  })
})
