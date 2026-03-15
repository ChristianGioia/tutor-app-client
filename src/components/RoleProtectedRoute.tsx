import { useAuth0 } from '@auth0/auth0-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import type { ReactNode } from 'react'
import { usePortal } from '../context/PortalContext'
import type { UserType } from '../api/client'

interface RoleProtectedRouteProps {
  children: ReactNode
  requiredRole: UserType
}

const LoadingWrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 16px;
`

const UnauthorizedWrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 16px;
  text-align: center;
  padding: 20px;

  h1 {
    color: #d32f2f;
  }

  p {
    color: #666;
    max-width: 400px;
  }

  button {
    margin-top: 16px;
    padding: 10px 24px;
    background-color: var(--accent);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
`

export function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading, logout } = useAuth0()
  const { userType, isLoadingUserType } = usePortal()
  const location = useLocation()
  const navigate = useNavigate()

  console.log('[RoleProtectedRoute]', {
    path: location.pathname,
    requiredRole,
    userType,
    isLoading,
    isLoadingUserType,
    isAuthenticated,
  })

  // Still loading auth or user type
  if (isLoading || isLoadingUserType) {
    return (
      <LoadingWrapper>
        <p>Loading…</p>
      </LoadingWrapper>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('[RoleProtectedRoute] Not authenticated, redirecting to /login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // No user type found - redirect to home (user needs to select a role first)
  if (!userType) {
    console.log('[RoleProtectedRoute] No user type found, redirecting to home')
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // User role doesn't match required role
  if (userType !== requiredRole) {
    console.log('[RoleProtectedRoute] User role mismatch', {
      userType,
      requiredRole,
      redirecting: true,
    })
    return (
      <UnauthorizedWrapper>
        <h1>Access Denied</h1>
        <p>
          You are signed in as a <strong>{userType}</strong>, but this portal is for{' '}
          <strong>{requiredRole}s</strong>.
        </p>
        <p>
          If you have multiple accounts, please sign out and log in with your {requiredRole}{' '}
          account.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button onClick={() => navigate(`/${userType}`)}>
            Go to {userType.charAt(0).toUpperCase() + userType.slice(1)} Portal
          </button>
          <button
            onClick={() => {
              logout({ logoutParams: { returnTo: window.location.origin } })
            }}
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Sign Out
          </button>
        </div>
      </UnauthorizedWrapper>
    )
  }

  console.log('[RoleProtectedRoute] All checks passed, rendering children')
  return <>{children}</>
}
