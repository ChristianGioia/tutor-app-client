import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'

const Wrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 16px;
`

export function CallbackPage() {
  const { error, handleRedirectCallback, isLoading } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    const finishLogin = async () => {
      try {
        const result = await handleRedirectCallback()
        const returnTo =
          (result?.appState as { returnTo?: string } | undefined)?.returnTo ?? '/'
        // Add a small delay to ensure auth state is updated before navigating
        await new Promise((resolve) => setTimeout(resolve, 500))
        navigate(returnTo, { replace: true })
      } catch {
        // If handleRedirectCallback throws, wait for auth state to settle
        await new Promise((resolve) => setTimeout(resolve, 500))
        navigate('/', { replace: true })
      }
    }
    finishLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wait for SDK to finish loading
  if (isLoading) {
    return (
      <Wrapper>
        <p>Loading…</p>
      </Wrapper>
    )
  }

  if (error) {
    return (
      <Wrapper>
        <h2>Authentication error</h2>
        <p>{error.message}</p>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <p>Signing you in…</p>
    </Wrapper>
  )
}
