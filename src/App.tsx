import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { CallbackPage } from './pages/CallbackPage'
import { TutorPortal } from './pages/TutorPortal'
import { ClientPortal } from './pages/ClientPortal'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
import { registerAuth0TokenGetter } from './api/client'

export default function App() {
  const { isLoading, getAccessTokenSilently, isAuthenticated } = useAuth0()

  // Register Auth0 token getter for API requests
  useEffect(() => {
    const getToken = async () => {
      if (!isAuthenticated) {
        return null
      }
      try {
        const token = await getAccessTokenSilently()
        return token
      } catch (error) {
        console.warn('[App] Could not get Auth0 token:', error)
        return null
      }
    }

    registerAuth0TokenGetter(getToken)
  }, [getAccessTokenSilently, isAuthenticated])

  if (isLoading) {
    return null
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/* Portal routes - protected by role */}
      <Route
        path="/tutor"
        element={
          <RoleProtectedRoute requiredRole="tutor">
            <TutorPortal />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/client"
        element={
          <RoleProtectedRoute requiredRole="client">
            <ClientPortal />
          </RoleProtectedRoute>
        }
      />

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
