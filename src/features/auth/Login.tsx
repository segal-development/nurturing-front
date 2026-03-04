import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLogin } from './hooks/useLogin'
import { LoginForm } from './components/LoginForm'
import type { LoginFormData } from './utils/validation'

/**
 * Validates that a return URL is safe (internal path only)
 * Prevents open redirect vulnerabilities
 */
function isValidReturnUrl(url: string | null): url is string {
  if (!url) return false
  // Must start with / and not be // (protocol-relative URL)
  // Must not contain protocol indicators
  return url.startsWith('/') && !url.startsWith('//') && !url.includes(':')
}

export const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { login, isLoading, error } = useLogin()

  // Get and validate the return URL from query params
  const returnUrl = useMemo(() => {
    const param = searchParams.get('returnUrl')
    return isValidReturnUrl(param) ? param : '/dashboard'
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl, { replace: true })
    }
  }, [isAuthenticated, navigate, returnUrl])

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      navigate(returnUrl, { replace: true })
    } catch (err) {
      // Error is handled by useLogin hook
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-8 border border-slate-200 dark:border-slate-700">
          {/* Header with Logo */}
          <div className="space-y-6 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src="https://sysgal.segal.cl/defensoria/assets/img/logo_defensoria.png" 
                alt="Defensoría del Deudor - Segal"
                className="h-20 w-auto object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                Sistema Nurturing
              </h1>
            </div>
          </div>

          {/* Form */}
          <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />

          {/* Footer */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
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
            <div className="text-center text-xs text-slate-400 dark:text-slate-500">
              <p>© {new Date().getFullYear()} Defensoría del Deudor - Grupo Segal</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
