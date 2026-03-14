import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import styled from '@emotion/styled'
import { usePortal } from '../context/PortalContext'

const Wrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 40px;
  padding: 40px 20px;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;

  h1 {
    text-align: center;
  }
`

const PortalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 800px;
`

interface PortalCardProps {
  $isSelected?: boolean
}

const PortalCard = styled.button<PortalCardProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px 24px;
  border-radius: 8px;
  background: var(--accent-bg);
  border: 2px solid ${(props) => (props.$isSelected ? 'var(--accent)' : 'var(--border)')};
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--sans);
  font-size: 16px;

  h2 {
    margin: 0;
    color: var(--text-h);
  }

  p {
    text-align: center;
    margin: 0;
    font-size: 14px;
    color: var(--text);
  }

  &:hover {
    box-shadow: var(--shadow);
    border-color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`

const LoginBtn = styled.button`
  font-size: 16px;
  padding: 10px 32px;
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid var(--accent-border);
  font-family: var(--sans);
  cursor: pointer;
  transition: box-shadow 0.2s;
  margin-top: 16px;

  &:hover {
    box-shadow: var(--shadow);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const { userType, setUserType, isLoadingUserType } = usePortal()

  const handleSelectTutor = () => {
    console.log('[HomePage] Selected: tutor')
    setUserType('tutor')
  }

  const handleSelectClient = () => {
    console.log('[HomePage] Selected: client')
    setUserType('client')
  }

  const handleLogin = async () => {
    console.log('[HomePage] handleLogin called, userType:', userType, 'isAuthenticated:', isAuthenticated)
    if (!userType) return

    if (isAuthenticated) {
      // Already logged in, redirect to portal
      console.log('[HomePage] Already authenticated, navigating to:', `/${userType}`)
      navigate(`/${userType}`)
    } else {
      // Trigger Auth0 login
      console.log('[HomePage] Starting Auth0 login with returnTo:', `/${userType}`)
      await loginWithRedirect({
        appState: { returnTo: `/${userType}` },
      })
    }
  }

  return (
    <Wrapper>
      <Section>
        <h1>Welcome to Tutor App</h1>
        <p>Choose which portal you'd like to access</p>
      </Section>

      <PortalGrid>
        <PortalCard
          $isSelected={userType === 'tutor'}
          onClick={handleSelectTutor}
          type="button"
        >
          <h2>Tutor Portal</h2>
          <p>Manage your tutoring sessions, students, and availability</p>
        </PortalCard>

        <PortalCard
          $isSelected={userType === 'client'}
          onClick={handleSelectClient}
          type="button"
        >
          <h2>Client Portal</h2>
          <p>Book sessions, track progress, and manage your learning</p>
        </PortalCard>
      </PortalGrid>

      {userType && (
        <div>
          <p>You selected: <strong>{userType}</strong></p>
          <LoginBtn onClick={handleLogin} disabled={isLoadingUserType}>
            {isLoadingUserType ? 'Processing...' : 'Continue'}
          </LoginBtn>
        </div>
      )}
    </Wrapper>
  )
}
