/**
 * Servicio de Autenticación para el backend Laravel 12
 * Usa autenticación basada en sesiones con Laravel Sanctum
 *
 * Sistema de Autenticación Sanctum:
 * - El backend emite cookies httpOnly: laravel_session, XSRF-TOKEN
 * - No hay tokens personalizados para manejar
 * - Las sesiones se renuevan automáticamente
 * - Si la sesión expira (401/419), se redirige a login
 */

import { logger } from '@/lib/logger'
import apiClient, { fetchCsrfToken } from './client'
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/auth'

export const authService = {
  /**
   * Iniciar sesión con Laravel Sanctum
   * Obtiene el token CSRF antes de enviar credenciales
   *
   * Flujo:
   * 1. Obtener token CSRF de /sanctum/csrf-cookie
   * 2. Enviar credenciales a POST /api/login
   * 3. Backend emite cookies httpOnly (laravel_session, XSRF-TOKEN)
   * 4. Todas las peticiones posteriores usan automáticamente las cookies
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {

      // Paso 1: Obtener token CSRF ANTES de login
      await fetchCsrfToken()

      // Paso 2: Enviar credenciales
      const response = await apiClient.post<LoginResponse>('/login', credentials)

      // Nota: NO guardamos access_token en localStorage
      // Laravel Sanctum maneja todo con cookies httpOnly
      if (response.data.access_token) {
        logger.log('Backend envió access_token, pero Sanctum con sesiones no lo necesita')
      }

      return response.data
    } catch (error: any) {
      logger.error('authService.login() - Error en login:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        responseData: error.response?.data,
      })
      throw error
    }
  },

  /**
   * Registrar nuevo usuario con Laravel Sanctum
   * Similar a login, obtiene token CSRF antes
   */
  async register(userData: RegisterRequest): Promise<{ user: User }> {
    try {
      await fetchCsrfToken()

      // Paso 2: Enviar datos de registro
      const { data } = await apiClient.post<{ user: User }>('/register', userData)

      return data
    } catch (error: any) {
      logger.error('authService.register() - Error en registro:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        responseData: error.response?.data,
      })
      throw error
    }
  },

  /**
   * Cerrar sesión con Laravel Sanctum
   *
   * Flujo:
   * 1. Enviar POST /api/logout al backend
   * 2. Backend invalida la sesión y debe eliminar las cookies httpOnly:
   *    - laravel-session
   *    - XSRF-TOKEN
   * 3. Frontend verifica que las cookies se eliminaron
   * 4. Frontend limpia el estado de autenticación (en AuthContext)
   * 5. Usuario redirigido a /login
   *
   * ⭐ NOTA IMPORTANTE:
   * - Las cookies httpOnly NO se pueden manipular desde JavaScript (seguridad XSS)
   * - El backend (Laravel) es responsable de eliminarlas en /api/logout
   * - Si las cookies aún existen después de logout, es un problema del backend
   *
   * Verificación del backend requerida en: app/Http/Controllers/AuthController.php
   * ```php
   * public function logout(Request $request)
   * {
   *     Auth::logout();
   *     // Invalidar sesión
   *     $request->session()->invalidate();
   *     $request->session()->regenerateToken();
   *     return response()->json(['message' => 'Logged out successfully']);
   * }
   * ```
   */
  async logout(): Promise<void> {
    try {

      // Llamar al endpoint de logout en el backend
      const response = await apiClient.post('/logout')

      logger.log('authService.logout() - Logout exitoso:', response.data)
    } catch (error: any) {
      logger.error('authService.logout() - Error al cerrar sesión:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })

      logger.log('Error en logout, pero el frontend continuará limpiando sesión')

      // No re-lanzar el error - SIEMPRE permitir que el usuario cierre sesión
      // El estado se limpiará en AuthContext de todas formas
    }
  },

  /**
   * Obtener usuario actual
   * Usa la sesión almacenada en cookies
   * Nota: Si hay 401, el interceptor de apiClient redirige a login
   */
  async getMe(): Promise<User> {
    try {
      logger.log('authService.getMe() - Obteniendo usuario actual...')
      const { data } = await apiClient.get<{ user: User }>('/me')
      logger.log('authService.getMe() - Usuario obtenido:', data.user)
      return data.user
    } catch (error: any) {
      logger.error('authService.getMe() - Error al obtener usuario:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      // Si es 401/419, el interceptor de apiClient redirige a login
      throw error
    }
  },

  /**
   * Obtener usuario actual sin redirigir en caso de 401
   * Usado durante la inicialización de autenticación
   * NO gatilla redireccionamiento a login en el interceptor
   */
  async getMeQuietly(): Promise<User> {
    try {
      logger.log('authService.getMeQuietly() - Obteniendo usuario actual (sin redirect en 401)...')
      // Usar baseClient con flag skipAuthRedirect para evitar redireccionamiento
      const response = await apiClient.get<{ user: User }>('/me', {
        skipAuthRedirect: true, // Flag personalizado para el interceptor
      } as any)
      logger.log('authService.getMeQuietly() - Usuario obtenido:', response.data.user)
      return response.data.user
    } catch (error: any) {
      logger.error('authService.getMeQuietly() - Error al obtener usuario:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
      throw error
    }
  },
}
