import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Login } from '../Login'
import { AuthProvider } from '@/context/AuthContext'
import { BrowserRouter } from 'react-router-dom'

// Mock the login API
vi.mock('@/api/auth', () => ({
  loginMutation: vi.fn()
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('Login Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LoginPage - Rendering', () => {
    it('should render login form with email and password fields', () => {
      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })

    it('should render submit button with correct label', () => {
      render(<Login />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      expect(submitButton).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })

    it('should render page title and description', () => {
      render(<Login />, { wrapper: createWrapper() })

      expect(screen.getByText(/nurturing system/i)).toBeInTheDocument()
      expect(screen.getByText(/inicia sesión para continuar/i)).toBeInTheDocument()
    })

    it('should render email input with correct type and placeholder', () => {
      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement

      expect(emailInput.type).toBe('email')
      expect(emailInput).toHaveAttribute('placeholder', expect.stringMatching(/correo/i))
    })

    it('should render password input with correct type', () => {
      render(<Login />, { wrapper: createWrapper() })

      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement

      expect(passwordInput.type).toBe('password')
    })
  })

  describe('LoginPage - Form Validation', () => {
    it('should show error message when email is empty', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/el correo es requerido/i)).toBeInTheDocument()
      })
    })

    it('should show error message when password is empty', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument()
      })
    })

    it('should show error message when email format is invalid', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/correo electrónico inválido/i)).toBeInTheDocument()
      })
    })

    it('should show error message when password is less than 8 characters', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const passwordInput = screen.getByLabelText(/contraseña/i)
      await user.type(passwordInput, 'short')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should accept valid email and password', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      await user.type(emailInput, 'valid@example.com')
      await user.type(passwordInput, 'ValidPassword123')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      // Should not have validation errors
      expect(screen.queryByText(/requerido/i)).not.toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('LoginPage - Form Submission', () => {
    it('should disable submit button while loading', async () => {
      const user = userEvent.setup()
      const { loginMutation } = await import('@/api/auth')

      vi.mocked(loginMutation).mockReturnValue({
        isPending: true,
        mutateAsync: vi.fn()
      } as any)

      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      await user.type(emailInput, 'valid@example.com')
      await user.type(passwordInput, 'ValidPassword123')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('should show error message on login failure', async () => {
      const user = userEvent.setup()
      const { loginMutation } = await import('@/api/auth')

      vi.mocked(loginMutation).mockReturnValue({
        isPending: false,
        error: new Error('Credenciales inválidas'),
        mutateAsync: vi.fn().mockRejectedValue(new Error('Credenciales inválidas'))
      } as any)

      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'WrongPassword123')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })
    })

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/requerido/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      await user.type(emailInput, 'test@example.com')

      // Error should be cleared for that field
      const errorMessages = screen.queryAllByText(/requerido/i)
      expect(errorMessages.length).toBeLessThan(2)
    })
  })

  describe('LoginPage - Accessibility', () => {
    it('should have proper label associations', () => {
      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)

      expect(emailInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('id')
    })

    it('should have form with role=form', () => {
      render(<Login />, { wrapper: createWrapper() })

      const form = screen.getByRole('form', { hidden: false })
      expect(form).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Login />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/correo electrónico/i)

      // Tab to email field
      await user.tab()
      expect(emailInput).toHaveFocus()

      // Type email
      await user.keyboard('test@example.com')

      // Tab to password field
      await user.tab()
      const passwordInput = screen.getByLabelText(/contraseña/i)
      expect(passwordInput).toHaveFocus()
    })
  })
})
