import { useAuth0 } from '@auth0/auth0-react'
import { Navigate, useLocation } from 'react-router-dom'
import styled from '@emotion/styled'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

const LoadingWrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 16px;
`

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth0()
  const location = useLocation()

  if (isLoading) {
    return (
      <LoadingWrapper>
        <p>Loading…</p>
      </LoadingWrapper>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
