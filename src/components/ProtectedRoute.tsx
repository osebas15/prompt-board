import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import type { ProtectedRouteProps } from '../features/auth/types/auth.types'

/**
 * Protected Route Component
 * 
 * Protects routes by checking authentication status and redirecting
 * unauthenticated users to the login page.
 */
export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div 
          data-testid="loading" 
          className="flex items-center justify-center min-h-screen"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo}
        state={{ from: location.pathname }}
        replace 
      />
    )
  }

  // Render protected content
  return <>{children}</>
}
