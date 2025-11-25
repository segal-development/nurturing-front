/**
 * API service for user profile operations
 * Handles profile updates and password changes
 */

import { apiClient } from './client'
import type { User } from '@/types/auth'

interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

interface ChangePasswordResponse {
  message: string
  success: boolean
}

export const profileService = {
  /**
   * Get current user profile
   * Usually called through authService.getMe() but available for explicit refresh
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/profile')
    return response.data.user
  },

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await apiClient.post<ChangePasswordResponse>('/change-password', data)
    return response.data
  },
}
