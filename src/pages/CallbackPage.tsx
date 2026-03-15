import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { usePortal } from '../context/PortalContext'

const Wrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  gap: 16px;
`

export function CallbackPage() {
  const { error, handleRedirectCallback, isLoading, user, isAuthenticated } = useAuth0()
  const navigate = useNavigate()
  const { syncUserWithBackend } = usePortal()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const hasHandledCallback = useRef(false)
  const hasSyncedUser = useRef(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Step 1: Handle the Auth0 callback (runs once)
  useEffect(() => {
    console.log('[Callback] useEffect triggered, hasHandledCallback:', hasHandledCallback.current)
    if (hasHandledCallback.current) return
    hasHandledCallback.current = true

    const processCallback = async () => {
      try {
        console.log('[Callback] Starting handleRedirectCallback...')
        console.log('[Callback] Current URL:', window.location.href)
        const result = await handleRedirectCallback()
        console.log('[Callback] handleRedirectCallback result:', result)
        console.log('[Callback] appState:', result?.appState)
        
        const destination =
          (result?.appState as { returnTo?: string } | undefined)?.returnTo ?? '/'
        console.log('[Callback] Will navigate to:', destination)
        setReturnTo(destination)
      } catch (err) {
        console.error('[Callback] handleRedirectCallback error:', err)
        console.error('[Callback] Error details:', (err as Error).message)
        // If already authenticated, get returnTo from localStorage as fallback
        const storedUserType = localStorage.getItem('tutor_app_usertype')
        const fallbackDestination = storedUserType ? `/${storedUserType}` : '/'
        console.log('[Callback] Using fallback destination:', fallbackDestination)
        setReturnTo(fallbackDestination)
      }
    }
    processCallback()
  }, [handleRedirectCallback])

  // Step 2: Once we have user info AND returnTo is set, sync with backend and navigate
  useEffect(() => {
    if (hasSyncedUser.current) return
    if (!returnTo) {
      console.log('[Callback] Waiting for returnTo to be set...')
      return
    }
    if (!isAuthenticated) {
      console.log('[Callback] Waiting for isAuthenticated...', { isAuthenticated })
      return
    }
    if (!user?.sub || !user?.email) {
      console.log('[Callback] Waiting for user info...', { user })
      return
    }

    hasSyncedUser.current = true

    // Capture values for use in async function (we know they're defined from the check above)
    const auth0Id = user.sub!
    const email = user.email!
    const name = user.name || undefined

    const syncAndNavigate = async () => {
      console.log('[Callback] User authenticated:', { sub: auth0Id, email })
      
      try {
        console.log('[Callback] Syncing user with backend...')
        await syncUserWithBackend(auth0Id, email, name)
        console.log('[Callback] User synced successfully')
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to sync user'
        console.error('[Callback] Failed to sync user:', err)
        setSyncError(errMsg)
        // Continue anyway after logging error
      }

      console.log('[Callback] Navigating to:', returnTo)
      navigate(returnTo, { replace: true })
    }
    syncAndNavigate()
  }, [returnTo, isAuthenticated, user, syncUserWithBackend, navigate])

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

  if (syncError) {
    return (
      <Wrapper>
        <h2>Registration error</h2>
        <p>{syncError}</p>
        <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Attempting to redirect anyway...
        </p>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <p>Signing you in…</p>
    </Wrapper>
  )
}
