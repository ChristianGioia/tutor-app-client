import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import styled from '@emotion/styled'
import { LoginPage } from './pages/LoginPage'
import { CallbackPage } from './pages/CallbackPage'
import { ProtectedRoute } from './components/ProtectedRoute'

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
`

const UserName = styled.span`
  font-size: 14px;
  color: var(--text);
`

const AuthBtn = styled.button`
  font-size: 14px;
  padding: 6px 16px;
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

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 24px;
  padding: 48px 20px;
`

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function HomePage() {
  const { user } = useAuth0()

  return (
    <Main>
      <h1>Welcome{user?.name ? `, ${user.name}` : ''}</h1>
      <p>You are signed in.</p>
    </Main>
  )
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------

function AppShell() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <Layout>
      <Header>
        {!isLoading && (
          <>
            {isAuthenticated ? (
              <>
                {user?.email && <UserName>{user.email}</UserName>}
                <AuthBtn onClick={handleLogout}>Log out</AuthBtn>
              </>
            ) : (
              <AuthBtn onClick={() => loginWithRedirect()}>Log in</AuthBtn>
            )}
          </>
        )}
      </Header>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  )
}

export default AppShell
