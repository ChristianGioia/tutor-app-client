import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { CallbackPage } from './pages/CallbackPage'
import { TutorPortal } from './pages/TutorPortal'
import { ClientPortal } from './pages/ClientPortal'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  const { isLoading } = useAuth0()

  if (isLoading) {
    return null
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/* Portal routes - protected */}
      <Route
        path="/tutor"
        element={
          <ProtectedRoute>
            <TutorPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client"
        element={
          <ProtectedRoute>
            <ClientPortal />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
