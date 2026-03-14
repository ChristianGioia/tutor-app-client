import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserType } from '../api/client'
import { registerUser, getUser } from '../api/client'

interface PortalContextType {
  userType: UserType | null
  setUserType: (type: UserType) => void
  isLoadingUserType: boolean
  syncUserWithBackend: (auth0Id: string, email: string, name?: string) => Promise<void>
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)
const USERTYPE_STORAGE_KEY = 'tutor_app_usertype'

export function PortalProvider({ children }: { children: ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType | null>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem(USERTYPE_STORAGE_KEY)
    console.log('[PortalContext] Initializing userType from localStorage:', stored)
    return (stored as UserType) || null
  })
  const [isLoadingUserType, setIsLoadingUserType] = useState(false)

  // Wrapper around setUserType that also persists to localStorage
  const setUserType = useCallback((type: UserType) => {
    console.log('[PortalContext] setUserType called with:', type)
    setUserTypeState(type)
    localStorage.setItem(USERTYPE_STORAGE_KEY, type)
  }, [])

  // Sync user type with backend after Auth0 login
  const syncUserWithBackend = useCallback(
    async (auth0Id: string, email: string, name?: string) => {
      console.log('[PortalContext] syncUserWithBackend called:', { auth0Id, email, name })
      console.log('[PortalContext] Current userType:', userType)
      setIsLoadingUserType(true)
      try {
        // Check if user exists in database
        console.log('[PortalContext] Checking if user exists...')
        const existingUser = await getUser(auth0Id)
        console.log('[PortalContext] getUser result:', existingUser)

        if (existingUser) {
          // User exists, use their stored type
          console.log('[PortalContext] User exists, setting userType to:', existingUser.userType)
          setUserType(existingUser.userType)
        } else if (userType) {
          // New user, register with the selected type
          console.log('[PortalContext] New user, registering with userType:', userType)
          const result = await registerUser({
            auth0Id,
            email,
            name,
            userType,
          })
          console.log('[PortalContext] registerUser result:', result)
        } else {
          console.warn('[PortalContext] Cannot register: userType is null')
        }
      } catch (error) {
        console.error('[PortalContext] Failed to sync user with backend:', error)
        // Continue anyway - user can still access the app
        // Backend will handle on next sync
      } finally {
        setIsLoadingUserType(false)
      }
    },
    [userType, setUserType]
  )

  return (
    <PortalContext.Provider
      value={{
        userType,
        setUserType,
        isLoadingUserType,
        syncUserWithBackend,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}
