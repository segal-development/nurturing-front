import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute component that ensures user is authenticated before accessing routes
 * Redirects to login if not authenticated, preserving the intended destination
 * Shows loading state while checking authentication
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  // Show loading screen while initializing auth from localStorage
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-segal-blue/5 to-segal-turquoise/5">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-segal-blue mx-auto" />
          <p className="text-segal-dark/60 font-medium">Iniciando sesión...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated, preserving the intended URL
  if (!isAuthenticated) {
    // Build the return URL from current location (path + search + hash)
    const returnUrl = location.pathname + location.search + location.hash
    
    // Only add returnUrl if it's not the root or dashboard (default destination)
    const loginPath = returnUrl && returnUrl !== '/' && returnUrl !== '/dashboard'
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/login'
    
    return <Navigate to={loginPath} replace />
  }

  // User is authenticated, render the protected component
  return <>{children}</>
}
