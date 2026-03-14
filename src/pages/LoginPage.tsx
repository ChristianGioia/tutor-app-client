import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from '@emotion/styled'

const Wrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 24px;
  padding: 40px 20px;
`

const LoginBtn = styled.button`
  font-size: 16px;
  padding: 10px 24px;
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid var(--accent-border);
  font-family: var(--sans);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const from = state?.from?.pathname ?? '/'

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, from])

  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: from },
    })
  }

  return (
    <Wrapper>
      <h1>Sign in</h1>
      <p>You need to be signed in to access this page.</p>
      <LoginBtn onClick={handleLogin}>Log in with Auth0</LoginBtn>
    </Wrapper>
  )
}
