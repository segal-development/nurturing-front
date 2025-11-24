import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute component that ensures user is authenticated before accessing routes
 * Redirects to login if not authenticated
 * Shows loading state while checking authentication
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth()

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated, render the protected component
  return <>{children}</>
}
