import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

/** Key used to track if user had an active session */
const SESSION_ACTIVE_KEY = 'nurturing_session_active'

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

  // Track when user has an active session
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true')
    }
  }, [isAuthenticated])

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
    
    // Check if user had an active session (means it expired)
    const hadActiveSession = sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true'
    
    // Clear the session flag so we don't show expired message on next direct access
    sessionStorage.removeItem(SESSION_ACTIVE_KEY)
    
    // Build login path with query params
    const params = new URLSearchParams()
    
    // Add returnUrl if it's not the root or dashboard (default destination)
    if (returnUrl && returnUrl !== '/' && returnUrl !== '/dashboard') {
      params.set('returnUrl', returnUrl)
    }
    
    // Only mark as session expired if user previously had an active session
    if (hadActiveSession) {
      params.set('sessionExpired', 'true')
    }
    
    const queryString = params.toString()
    const loginPath = queryString ? `/login?${queryString}` : '/login'
    
    return <Navigate to={loginPath} replace />
  }

  // User is authenticated, render the protected component
  return <>{children}</>
}
