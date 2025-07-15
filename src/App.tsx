import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/providers/AuthProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { EnvDebugger } from '@/components/EnvDebugger'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { SearchBar } from '@/features/search/components'
import { AnalyticsDashboard } from '@/features/analytics/components'
import { ShortcutsManager } from '@/features/shortcuts/components'
import { WorkflowsManager } from '@/features/automation/components'
import './App.css'

const Dashboard = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Prompt Board</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="w-80">
                <SearchBar placeholder="Search prompts, categories, and content..." />
              </div>
              {/* Shortcuts Manager */}
              <ShortcutsManager />
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-8">
          {/* Analytics Dashboard */}
          <AnalyticsDashboard />
          
          {/* Workflows Manager */}
          <WorkflowsManager />
        </div>
      </main>
    </div>
  )
}

const SupabaseConnectionError = ({ onRetry, errorDetails }: { onRetry: () => void; errorDetails?: string }) => {
  return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Supabase Connection Error</h3>
            <p className="text-sm text-gray-600 mb-6">
              Unable to connect to Supabase for authentication. This is normal when Supabase is not running locally.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="text-left text-sm">
                <h4 className="font-medium text-yellow-800 mb-2">To fix this issue:</h4>
                <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                  <li>
                    <strong>Start Supabase locally:</strong>
                    <br />
                    <code className="bg-yellow-100 px-2 py-1 rounded mt-1 block">supabase start</code>
                  </li>
                  <li>
                    <strong>Or configure your remote Supabase project:</strong>
                    <br />
                    Update <code className="bg-yellow-100 px-1 rounded">.env.local</code> with your project URL and anon key
                  </li>
                  <li>
                    <strong>Verify your setup:</strong>
                    <br />
                    Check that environment variables are loaded correctly
                  </li>
                </ol>
              </div>
            </div>

            <button
              onClick={onRetry}
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Retry Connection
            </button>

            <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
              <p><strong>Debug Information:</strong></p>
              <p>Supabase URL: <code className="bg-gray-100 px-1 rounded">{import.meta.env.VITE_SUPABASE_URL || 'Not set'}</code></p>
              <p>Anon Key: <code className="bg-gray-100 px-1 rounded">{import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</code></p>
              <p>Environment: <code className="bg-gray-100 px-1 rounded">{import.meta.env.MODE}</code></p>
              <p>Time: <code className="bg-gray-100 px-1 rounded">{new Date().toLocaleTimeString()}</code></p>
              {errorDetails && (
                <p>Error: <code className="bg-red-100 px-1 rounded text-red-700">{errorDetails}</code></p>
              )}
            </div>

            <div className="mt-4">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  🔧 Advanced Debug Info
                </summary>
                <div className="mt-2">
                  <EnvDebugger />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AppContent = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  )
}

function App() {
  const [hasConnectionError, setHasConnectionError] = React.useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = React.useState(true)
  const [errorDetails, setErrorDetails] = React.useState<string>('')

  // Check if we can connect to Supabase
  const checkSupabaseConnection = React.useCallback(async () => {
    setIsCheckingConnection(true)
    setErrorDetails('')
    try {
      // Simple check for required environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const missingVars = []
        if (!import.meta.env.VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL')
        if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY')
        
        const errorMsg = `Missing environment variables: ${missingVars.join(', ')}`
        console.error(errorMsg)
        setErrorDetails(errorMsg)
        setHasConnectionError(true)
        return
      }

      console.log('Attempting to connect to Supabase at:', import.meta.env.VITE_SUPABASE_URL)

      // Try to import and use the Supabase client
      const { supabase } = await import('./lib/supabase')
      const { error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Supabase auth error:', error)
        setErrorDetails(`Auth error: ${error.message}`)
        setHasConnectionError(true)
      } else {
        console.log('Supabase connection successful')
        setHasConnectionError(false)
        setErrorDetails('')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown connection error'
      console.error('Supabase connection error:', error)
      setErrorDetails(errorMsg)
      setHasConnectionError(true)
    } finally {
      setIsCheckingConnection(false)
    }
  }, [])

  React.useEffect(() => {
    checkSupabaseConnection()
  }, [checkSupabaseConnection])

  // Show loading spinner while checking connection
  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking Supabase connection...</p>
          <p className="text-xs text-gray-500 mt-2">
            Connecting to: {import.meta.env.VITE_SUPABASE_URL}
          </p>
        </div>
      </div>
    )
  }

  // Show connection error if we can't connect to Supabase
  if (hasConnectionError) {
    return <SupabaseConnectionError onRetry={checkSupabaseConnection} errorDetails={errorDetails} />
  }

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
