import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext'
import { ReactNode } from 'react'

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, error, logout } = useAuth()

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {isAuthenticated && <p>Authenticated: {user?.email}</p>}
      {error && <p>Error: {error}</p>}
      {!isAuthenticated && <p>Not authenticated</p>}
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  describe('AuthProvider - Initialization', () => {
    it('should provide auth context to children', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })

    it('should initialize with null user', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })

    it('should throw error when useAuth is used outside provider', () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow(/useAuth debe usarse dentro de AuthProvider/i)

      consoleSpy.mockRestore()
    })
  })

  describe('AuthContext - User State', () => {
    it('should set user when credentials are provided', async () => {
      const TestSetUser = () => {
        const { setUser, user, isAuthenticated } = useAuth()

        return (
          <div>
            <button
              onClick={() =>
                setUser({
                  id: '1',
                  email: 'test@example.com',
                  nombre: 'Test User',
                  rol: 'user'
                })
              }
            >
              Set User
            </button>
            {isAuthenticated && <p>User: {user?.email}</p>}
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestSetUser />
        </AuthProvider>
      )

      const button = screen.getByRole('button', { name: /set user/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/User: test@example.com/i)).toBeInTheDocument()
      })
    })

    it('should update isAuthenticated when user is set', async () => {
      const TestSetUser = () => {
        const { setUser, isAuthenticated } = useAuth()

        return (
          <div>
            <p>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
            <button
              onClick={() =>
                setUser({
                  id: '1',
                  email: 'test@example.com',
                  nombre: 'Test User',
                  rol: 'user'
                })
              }
            >
              Set User
            </button>
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestSetUser />
        </AuthProvider>
      )

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()

      const button = screen.getByRole('button', { name: /set user/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Authenticated')).toBeInTheDocument()
      })
    })

    it('should store user data correctly', async () => {
      const TestSetUser = () => {
        const { setUser, user } = useAuth()

        return (
          <div>
            <button
              onClick={() =>
                setUser({
                  id: '123',
                  email: 'john@example.com',
                  nombre: 'John Doe',
                  rol: 'admin'
                })
              }
            >
              Set User
            </button>
            {user && (
              <div>
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Nombre: {user.nombre}</p>
                <p>Rol: {user.rol}</p>
              </div>
            )}
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestSetUser />
        </AuthProvider>
      )

      const button = screen.getByRole('button', { name: /set user/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('ID: 123')).toBeInTheDocument()
        expect(screen.getByText('Email: john@example.com')).toBeInTheDocument()
        expect(screen.getByText('Nombre: John Doe')).toBeInTheDocument()
        expect(screen.getByText('Rol: admin')).toBeInTheDocument()
      })
    })
  })

  describe('AuthContext - Logout', () => {
    it('should clear user on logout', async () => {
      const TestLogout = () => {
        const { setUser, logout, user, isAuthenticated } = useAuth()

        return (
          <div>
            <button
              onClick={() =>
                setUser({
                  id: '1',
                  email: 'test@example.com',
                  nombre: 'Test User',
                  rol: 'user'
                })
              }
            >
              Set User
            </button>
            <button onClick={logout}>Logout</button>
            <p>{isAuthenticated ? `Logged in as ${user?.email}` : 'Not authenticated'}</p>
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestLogout />
        </AuthProvider>
      )

      // Set user
      const setButton = screen.getByRole('button', { name: /set user/i })
      await user.click(setButton)

      await waitFor(() => {
        expect(screen.getByText(/Logged in as test@example.com/i)).toBeInTheDocument()
      })

      // Logout
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument()
      })
    })

    it('should set user to null on logout', async () => {
      const TestLogout = () => {
        const { setUser, logout, user } = useAuth()

        return (
          <div>
            <button
              onClick={() =>
                setUser({
                  id: '1',
                  email: 'test@example.com',
                  nombre: 'Test User',
                  rol: 'user'
                })
              }
            >
              Set User
            </button>
            <button onClick={logout}>Logout</button>
            <p>{user ? `User: ${user.email}` : 'No user'}</p>
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestLogout />
        </AuthProvider>
      )

      const setButton = screen.getByRole('button', { name: /set user/i })
      await user.click(setButton)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByText('No user')).toBeInTheDocument()
      })
    })
  })

  describe('AuthContext - Error Handling', () => {
    it('should set and clear error messages', async () => {
      const TestError = () => {
        const { error, setError, clearError } = useAuth()

        return (
          <div>
            <button onClick={() => setError('Test error message')}>Set Error</button>
            <button onClick={clearError}>Clear Error</button>
            {error && <p>Error: {error}</p>}
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestError />
        </AuthProvider>
      )

      const setErrorButton = screen.getByRole('button', { name: /set error/i })
      await user.click(setErrorButton)

      await waitFor(() => {
        expect(screen.getByText('Error: Test error message')).toBeInTheDocument()
      })

      const clearErrorButton = screen.getByRole('button', { name: /clear error/i })
      await user.click(clearErrorButton)

      await waitFor(() => {
        expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
      })
    })
  })

  describe('AuthContext - Loading State', () => {
    it('should manage loading state', async () => {
      const TestLoading = () => {
        const { isLoading, setLoading } = useAuth()

        return (
          <div>
            <button onClick={() => setLoading(true)}>Set Loading</button>
            <button onClick={() => setLoading(false)}>Clear Loading</button>
            {isLoading && <p>Loading...</p>}
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestLoading />
        </AuthProvider>
      )

      const setLoadingButton = screen.getByRole('button', { name: /set loading/i })
      await user.click(setLoadingButton)

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      const clearLoadingButton = screen.getByRole('button', { name: /clear loading/i })
      await user.click(clearLoadingButton)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })
  })

  describe('AuthContext - Token Management', () => {
    it('should store and retrieve token', async () => {
      const TestToken = () => {
        const { setToken, token } = useAuth()

        return (
          <div>
            <button onClick={() => setToken('jwt-token-123')}>Set Token</button>
            {token && <p>Token set: {token.substring(0, 10)}...</p>}
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestToken />
        </AuthProvider>
      )

      const setTokenButton = screen.getByRole('button', { name: /set token/i })
      await user.click(setTokenButton)

      await waitFor(() => {
        expect(screen.getByText('Token set: jwt-token...')).toBeInTheDocument()
      })
    })

    it('should clear token on logout', async () => {
      const TestToken = () => {
        const { setToken, logout, token } = useAuth()

        return (
          <div>
            <button onClick={() => setToken('jwt-token-123')}>Set Token</button>
            <button onClick={logout}>Logout</button>
            <p>{token ? 'Token exists' : 'No token'}</p>
          </div>
        )
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestToken />
        </AuthProvider>
      )

      const setTokenButton = screen.getByRole('button', { name: /set token/i })
      await user.click(setTokenButton)

      await waitFor(() => {
        expect(screen.getByText('Token exists')).toBeInTheDocument()
      })

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByText('No token')).toBeInTheDocument()
      })
    })
  })

  describe('AuthContext - Multiple Components', () => {
    it('should share state between multiple components using context', async () => {
      const ComponentA = () => {
        const { setUser } = useAuth()
        return (
          <button
            onClick={() =>
              setUser({
                id: '1',
                email: 'test@example.com',
                nombre: 'Test User',
                rol: 'user'
              })
            }
          >
            Set User in A
          </button>
        )
      }

      const ComponentB = () => {
        const { user, isAuthenticated } = useAuth()
        return <p>{isAuthenticated ? `Authenticated as ${user?.email}` : 'Not authenticated'}</p>
      }

      const user = userEvent.setup()
      render(
        <AuthProvider>
          <ComponentA />
          <ComponentB />
        </AuthProvider>
      )

      const button = screen.getByRole('button', { name: /set user in a/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Authenticated as test@example.com/i)).toBeInTheDocument()
      })
    })
  })
})
