import { useAuth0 } from '@auth0/auth0-react'
import styled from '@emotion/styled'
import { TutorCalendar } from '../components/TutorCalendar'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  flex-shrink: 0;
`

const Logo = styled.h1`
  margin: 0;
  font-size: 20px;
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const UserEmail = styled.span`
  font-size: 14px;
  color: var(--text);
`

const LogoutBtn = styled.button`
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
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

export function TutorPortal() {
  const { user, logout } = useAuth0()

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <Container>
      <Header>
        <Logo>Tutor Portal - Calendar</Logo>
        <UserSection>
          <UserEmail>{user?.email}</UserEmail>
          <LogoutBtn onClick={handleLogout}>Log out</LogoutBtn>
        </UserSection>
      </Header>

      <Main>
        <TutorCalendar />
      </Main>
    </Container>
  )
}
