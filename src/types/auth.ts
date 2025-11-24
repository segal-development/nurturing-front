/**
 * Tipos de autenticación para el backend Laravel 12
 */

export interface User {
  id: number
  name: string
  email: string
  role: string
  permissions?: string[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  access_token?: string // Solo para testing con Postman
  token_type: 'Bearer'
  user: User
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}
