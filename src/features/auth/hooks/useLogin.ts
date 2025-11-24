/**
 * Hook useLogin para usar el AuthContext con el backend Laravel 12
 */

import { useAuth } from '@/context/AuthContext'
import type { LoginRequest } from '@/types/auth'

export const useLogin = () => {
  const { login, isLoading, error } = useAuth()

  return {
    login: async (email: string, password: string) => {
      const credentials: LoginRequest = { email, password }
      return await login(credentials)
    },
    isLoading,
    error,
  }
}
