import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLogin } from './hooks/useLogin'
import { LoginForm } from './components/LoginForm'
import type { LoginFormData } from './utils/validation'

export const Login = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { login, isLoading, error } = useLogin()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err) {
      // Error is handled by useLogin hook
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-segal-blue/5 to-segal-turquoise/5 flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="bg-background rounded-xl shadow-lg p-8 space-y-8 border border-segal-blue/10">
          {/* Header with Segal Branding */}
          <div className="space-y-4 text-center">
            {/* Logo Placeholder */}
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-segal-blue to-segal-turquoise rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-segal-dark">
                Nurturing System
              </h1>
              <p className="text-segal-dark/60">
                Sistema de gestión de clientes - Segal
              </p>
            </div>
          </div>

          {/* Form */}
          <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />

          {/* Footer */}
          <div className="space-y-4 border-t border-segal-blue/10 pt-4">
            <div className="text-center text-sm text-segal-dark/60">
              <p>
                ¿Problemas para iniciar sesión?{' '}
                <a
                  href="/support/login-help"
                  className="text-segal-blue hover:text-segal-blue/80 font-medium focus:outline-none focus:ring-2 focus:ring-segal-blue/50 rounded px-1 transition-colors"
                >
                  Contáctanos
                </a>
              </p>
            </div>

            {/* Segal Branding Footer */}
            <div className="text-center text-xs text-segal-dark/40">
              <p>© 2024 Segal - Defensa de Deudores</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
