/**
 * Auth Context para el backend Laravel 12 con cookies httpOnly
 * Implementa refresh token automático para mantener sesiones activas
 *
 * Sistema de Tokens:
 * - access_token: cookie httpOnly, corta duración (ej. 15 min)
 * - refresh_token: cookie httpOnly, larga duración (ej. 7 días)
 *
 * Cuando el access_token expira:
 * 1. El interceptor de axios detecta el error 401
 * 2. Automáticamente intenta refrescar usando el refresh_token
 * 3. Si funciona, reintenta la petición original
 * 4. Si falla, redirige a login
 *
 * El usuario solo necesita iniciar sesión una vez (duración del refresh_token)
 */

import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react'
import { authService } from '@/api/auth.service'
import type { User, LoginRequest } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitializing: boolean
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  setError: (error: string) => void
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'INIT_AUTH'; payload: User }
  | { type: 'SET_INITIALIZING'; payload: boolean }

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitializing: true,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        error: null,
        isLoading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      }
    case 'INIT_AUTH':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isInitializing: false,
      }
    case 'SET_INITIALIZING':
      return {
        ...state,
        isInitializing: action.payload,
      }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Inicializar autenticación verificando con el backend
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const user = await authService.getMe()
        if (isMounted) {
          dispatch({ type: 'INIT_AUTH', payload: user })
        }
      } catch (error: any) {
        // Usuario no autenticado, cookies expiradas o inválidas
        if (isMounted) {
          const status = error.response?.status
          const message = error.response?.data?.message || error.message

          // Log detallado para debug
          console.warn('Error inicializando autenticación:', {
            status,
            message,
            url: error.config?.url,
            headers: error.config?.headers,
          })

          // 401 es normal si no hay sesión activa
          if (status === 401) {
            console.log('No hay sesión activa, usuario debe iniciar sesión')
          }

          dispatch({ type: 'SET_INITIALIZING', payload: false })
        }
      }
    }

    initializeAuth()

    // Cleanup para evitar memory leaks
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      const response = await authService.login(credentials)
      dispatch({ type: 'SET_USER', payload: response.user })
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Error al iniciar sesión'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      await authService.logout()
      dispatch({ type: 'LOGOUT' })
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cerrar sesión'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        clearError,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
